import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db as prisma } from '@/lib/db';

function isAdmin(session: any) {
  return (session?.user as any)?.role === 'admin';
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) return NextResponse.json({ message: 'Forbidden' }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const timeframe = searchParams.get('timeframe') || 'this_year';

  try {
    const [
      totalUsers, 
      totalProducts, 
      totalTransactions, 
      totalHibah, 
      totalHibahRequests,
      transactions,
      boosts
    ] = await Promise.all([
      prisma.user.count(),
      prisma.product.count(),
      prisma.transaction.count(),
      prisma.product.count({ where: { type: 'hibah' } }),
      prisma.hibahRequest.count(),
      prisma.transaction.findMany({ where: { status: 'success' }, select: { totalPrice: true } }),
      prisma.productBoost.findMany({ select: { price: true, status: true } }),
    ]);

    const totalTransactionRevenue = transactions.reduce((acc, t) => acc + Number(t.totalPrice || 0), 0);
    const totalBoostRevenue = boosts.filter(b => b.status === 'active' || b.status === 'expired').reduce((acc, b) => acc + Number(b.price || 0), 0);
    
    // We only take a small fee from transactions (e.g., 5% platform fee) if we had one.
    // For now, let's just show Total Nilai Transaksi and Total Pendapatan Iklan.

    const recentTransactions = await prisma.transaction.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
    });
    
    // Fix BigInt serialization for Next.js JSON response
    const formattedRecentTransactions = recentTransactions.map(t => ({
      ...t,
      totalPrice: t.totalPrice ? Number(t.totalPrice) : null
    }));

    const recentUsers = await prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { profile: true },
    });

    // --- Chart Data Logic (Dynamic Timeframe) ---
    const now = new Date();
    let startDate = new Date();
    let bucketCount = 12;
    let step = 'month';

    if (timeframe === 'this_month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1); // Start of current month
      bucketCount = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate(); // Days in current month
      step = 'day';
    } else if (timeframe === 'this_year') {
      startDate = new Date(now.getFullYear(), 0, 1); // Start of current year
      bucketCount = 12;
      step = 'month';
    } else if (timeframe === '5y') {
      startDate = new Date(now.getFullYear() - 4, 0, 1); // 5 years ago, start of year
      bucketCount = 5;
      step = 'year';
    }
    
    const chartTransactions = await prisma.transaction.findMany({
      where: { createdAt: { gte: startDate } },
      select: { createdAt: true, totalPrice: true, status: true }
    });

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];
    const chartData: any[] = [];
    
    for (let i = 0; i < bucketCount; i++) {
      if (step === 'day') {
        const day = i + 1;
        chartData.push({
          name: `${day} ${monthNames[now.getMonth()]}`,
          day: day,
          revenue: 0,
          transactions: 0
        });
      } else if (step === 'month') {
        chartData.push({
          name: monthNames[i],
          monthIndex: i,
          revenue: 0,
          transactions: 0
        });
      } else if (step === 'year') {
        const year = startDate.getFullYear() + i;
        chartData.push({
          name: `${year}`,
          year: year,
          revenue: 0,
          transactions: 0
        });
      }
    }

    chartTransactions.forEach(t => {
      const d = new Date(t.createdAt);
      let bucket;
      
      if (step === 'day') {
        bucket = chartData.find(b => b.day === d.getDate());
      } else if (step === 'month') {
        bucket = chartData.find(b => b.monthIndex === d.getMonth());
      } else {
        bucket = chartData.find(b => b.year === d.getFullYear());
      }
      
      if (bucket) {
        bucket.transactions++;
        if (t.status === 'success') {
          bucket.revenue += Number(t.totalPrice || 0);
        }
      }
    });

    return NextResponse.json({
      totalUsers,
      totalProducts,
      totalTransactions,
      totalHibah,
      totalHibahRequests,
      totalTransactionRevenue,
      totalBoostRevenue,
      chartData,
      recentTransactions: formattedRecentTransactions,
      recentUsers,
    });
  } catch (e: any) {
    return NextResponse.json({ message: e.message }, { status: 500 });
  }
}
