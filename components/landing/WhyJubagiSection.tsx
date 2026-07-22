import { Leaf, Zap, Gift, Star } from 'lucide-react';

export function WhyJubagiSection() {
  return (
    <section className="w-full py-24 bg-gradient-to-b from-white to-[#FFF5F8]/40">
       <div className="max-w-7xl mx-auto px-6 w-full">
           <div className="text-center flex flex-col items-center mb-16">
              <div className="bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-medium mb-4">
                 Kenapa JUBAGI?
              </div>
              <h2 className="text-3xl lg:text-4xl font-bold mb-4 text-foreground">
                 Lebih dari Sekadar <span className="text-primary">Marketplace</span>
              </h2>
              <p className="text-muted-foreground max-w-xl text-lg">
                 JUBAGI hadir untuk membuat transaksi barang bekas lebih mudah, aman, dan bermakna bagi semua.
              </p>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
              {/* Feature 1 */}
              <div className="bg-card rounded-[2rem] p-8 lg:p-10 shadow-sm border border-border hover:shadow-xl hover:-translate-y-2 transition-all duration-300 relative overflow-hidden group flex flex-col">
                 <div className="absolute top-0 right-0 w-40 h-40 bg-green-50 rounded-bl-full -z-10 group-hover:scale-110 transition-transform" />
                 <div className="w-16 h-16 bg-green-50 text-[#22C55E] rounded-2xl flex items-center justify-center mb-8">
                    <Leaf className="w-8 h-8" />
                 </div>
                 <h3 className="text-xl font-bold mb-4 text-foreground">Hemat & Ramah Lingkungan</h3>
                 <p className="text-muted-foreground mb-8 text-base leading-relaxed flex-1">
                    Dapatkan barang berkualitas dengan harga lebih terjangkau sekaligus membantu mengurangi limbah. Belanja cerdas, bumi senang!
                 </p>
                 <div className="inline-flex w-fit bg-green-50 text-[#22C55E] text-xs font-bold px-4 py-2 rounded-full">
                    80% lebih hemat
                 </div>
              </div>
              
              {/* Feature 2 */}
              <div className="bg-card rounded-[2rem] p-8 lg:p-10 shadow-sm border border-border hover:shadow-xl hover:-translate-y-2 transition-all duration-300 relative overflow-hidden group flex flex-col">
                 <div className="absolute top-0 right-0 w-40 h-40 bg-[#FCD8CD]/30 rounded-bl-full -z-10 group-hover:scale-110 transition-transform" />
                 <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-8">
                    <Zap className="w-8 h-8" />
                 </div>
                 <h3 className="text-xl font-bold mb-4 text-foreground">Mudah Jual & Beli</h3>
                 <p className="text-muted-foreground mb-8 text-base leading-relaxed flex-1">
                    Proses jual beli yang simpel, cepat, dan aman. Upload produk dalam hitungan menit dan temukan pembeli yang tepat.
                 </p>
                 <div className="inline-flex w-fit bg-primary/10 text-primary text-xs font-bold px-4 py-2 rounded-full">
                    &lt; 2 menit upload
                 </div>
              </div>
              
              {/* Feature 3 */}
              <div className="bg-card rounded-[2rem] p-8 lg:p-10 shadow-sm border border-border hover:shadow-xl hover:-translate-y-2 transition-all duration-300 relative overflow-hidden group flex flex-col">
                 <div className="absolute top-0 right-0 w-40 h-40 bg-orange-50 rounded-bl-full -z-10 group-hover:scale-110 transition-transform" />
                 <div className="w-16 h-16 bg-orange-50 text-orange-500 rounded-2xl flex items-center justify-center mb-8">
                    <Gift className="w-8 h-8" />
                 </div>
                 <h3 className="text-xl font-bold mb-4 text-foreground">Bisa Hibah Barang</h3>
                 <p className="text-muted-foreground mb-8 text-base leading-relaxed flex-1">
                    Punya barang tidak terpakai? Hibahkan kepada yang membutuhkan. Berbagi itu indah dan membuat perbedaan nyata.
                 </p>
                 <div className="inline-flex w-fit bg-orange-50 text-orange-500 text-xs font-bold px-4 py-2 rounded-full">
                    500+ hibah sukses
                 </div>
              </div>
           </div>
           
           <div className="bg-card rounded-[2rem] p-8 flex flex-col md:flex-row items-center justify-center gap-8 shadow-md border border-primary/20 max-w-4xl mx-auto">
              <div className="flex items-center">
                 <div className="flex -space-x-3">
                    {[32, 12, 45, 68].map((i) => (
                      <div key={i} className="w-14 h-14 rounded-full border-4 border-white bg-gray-200 overflow-hidden shadow-sm">
                         <img src={`https://i.pravatar.cc/100?img=${i}`} alt="User avatar" />
                      </div>
                    ))}
                    <div className="w-14 h-14 rounded-full border-4 border-white bg-primary text-white flex items-center justify-center font-bold text-sm shadow-sm z-10">
                       5K+
                    </div>
                 </div>
              </div>
              <div className="text-center md:text-left flex-1">
                 <h4 className="font-bold text-xl text-foreground">Bergabung dengan 5.000+ pengguna aktif</h4>
                 <p className="text-muted-foreground text-base mt-1">yang sudah merasakan manfaat JUBAGI setiap harinya.</p>
              </div>
              <div className="flex gap-1 text-primary">
                 {[1,2,3,4,5].map(i => <Star key={i} className="w-6 h-6 fill-current" />)}
              </div>
           </div>
       </div>
    </section>
  );
}
