const images = [
  {
    url: "https://images.pexels.com/photos/8574662/pexels-photo-8574662.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    caption: "Luxury waterfront properties — Real Estate wealth",
  },
  {
    url: "https://images.pexels.com/photos/8386440/pexels-photo-8386440.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    caption: "AI & Robotics — The future of technology",
  },
  {
    url: "https://images.pexels.com/photos/30268013/pexels-photo-30268013.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    caption: "Stock market & crypto — FinTech opportunities",
  },
  {
    url: "https://images.pexels.com/photos/16513917/pexels-photo-16513917.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    caption: "Luxury real estate — Tangible wealth creation",
  },
  {
    url: "https://images.pexels.com/photos/6956903/pexels-photo-6956903.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    caption: "E-Commerce revolution — Digital retail empires",
  },
  {
    url: "https://images.pexels.com/photos/9574465/pexels-photo-9574465.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    caption: "Biotech innovation — Life-saving billion-dollar ventures",
  },
  {
    url: "https://images.pexels.com/photos/4691472/pexels-photo-4691472.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    caption: "Gold & crypto — Modern stores of value",
  },
  {
    url: "https://images.pexels.com/photos/7413913/pexels-photo-7413913.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    caption: "Startup pitching — Securing venture capital",
  },
];

export default function GallerySection() {
  return (
    <section className="py-24 bg-gray-900 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-16">
          <span className="text-amber-400 text-sm font-semibold tracking-widest uppercase">
            Visual Inspiration
          </span>
          <h2 className="text-4xl md:text-5xl font-black text-white mt-3 mb-5">
            The World of{" "}
            <span className="bg-gradient-to-r from-amber-300 to-yellow-500 bg-clip-text text-transparent">
              Wealth Creation
            </span>
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto text-lg">
            Real images from the industries and lifestyles that define extraordinary wealth.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {images.map((img, i) => (
            <div
              key={i}
              className={`group relative overflow-hidden rounded-2xl ${
                i === 0 || i === 5 ? "md:col-span-2 md:row-span-2" : ""
              }`}
            >
              <img
                src={img.url}
                alt={img.caption}
                className="w-full h-full object-cover min-h-[200px] group-hover:scale-110 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-gray-950/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                <p className="text-white text-sm font-medium">{img.caption}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
