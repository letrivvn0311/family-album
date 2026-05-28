import React, { useState, useEffect, useRef } from 'react';

// ============================================================================
// DATA MẪU BAN ĐẦU (Sử dụng ảnh Unsplash chất lượng cao về chủ đề gia đình)
// ============================================================================
const INITIAL_PHOTOS = [
  {
    id: 1,
    title: "Tết Sum Vầy 2024",
    description: "Cả nhà cùng nhau gói bánh chưng xanh, tiếng cười rộn rã khắp sân nhà mùng 1 Tết.",
    category: "Ngày lễ",
    year: 2024,
    date: "2024-02-10",
    location: "Hà Nội",
    likes: 12,
    src: "https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&w=1200&q=80"
  },
  {
    id: 2,
    title: "Sinh Nhật Bé Bún 5 Tuổi",
    description: "Bé thổi nến ước một siêu nhân thật to. Thời gian trôi nhanh quá, con đã lớn khôn thế này.",
    category: "Sinh nhật",
    year: 2024,
    date: "2024-05-15",
    location: "TP. Hồ Chí Minh",
    likes: 24,
    src: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=1200&q=80"
  },
  {
    id: 3,
    title: "Mùa Hè Rực Rỡ Tại Phú Quốc",
    description: "Dấu chân trên cát mịn, hoàng hôn buông xuống nhuộm hồng cả bờ biển và nụ cười của mẹ.",
    category: "Du lịch",
    year: 2025,
    date: "2025-07-20",
    location: "Phú Quốc",
    likes: 18,
    src: "https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?auto=format&fit=crop&w=1200&q=80"
  },
  {
    id: 4,
    title: "Chiều Chủ Nhật Bình Yên",
    description: "Bố dạy cu Bi tập đi xe đạp hai bánh ở công viên gần nhà. Ngã mấy lần nhưng vẫn cười tươi.",
    category: "Thường nhật",
    year: 2025,
    date: "2025-10-12",
    location: "Đà Nẵng",
    likes: 9,
    src: "https://images.unsplash.com/photo-1484981138541-3d074aa97716?auto=format&fit=crop&w=1200&q=80"
  },
  {
    id: 5,
    title: "Đón Giáng Sinh Ấm Áp",
    description: "Cây thông rực rỡ ánh đèn màu, cả nhà quây quần bên lò sưởi nhân tạo và tặng nhau những món quà nhỏ.",
    category: "Ngày lễ",
    year: 2025,
    date: "2025-12-24",
    location: "Đà Lạt",
    likes: 31,
    src: "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=1200&q=80"
  },
  {
    id: 6,
    title: "Chuyến Đi Săn Mây Sapa",
    description: "Đứng trên đỉnh Fansipan đón ánh ban mai đầu tiên của năm mới 2026. Trời lạnh buốt nhưng lòng ấm áp.",
    category: "Du lịch",
    year: 2026,
    date: "2026-01-02",
    location: "Sapa",
    likes: 42,
    src: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80"
  }
];

const CATEGORIES = ["Tất cả", "Ngày lễ", "Sinh nhật", "Du lịch", "Thường nhật"];
const YEARS = ["Tất cả", 2024, 2025, 2026];

// ============================================================================
// HỆ THỐNG ICON SVG TRỰC QUAN (Tái tạo từ Lucide)
// ============================================================================
const Icons = {
  Heart: ({ className, filled }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </svg>
  ),
  Calendar: ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" />
    </svg>
  ),
  MapPin: ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" />
    </svg>
  ),
  Camera: ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" /><circle cx="12" cy="13" r="3" />
    </svg>
  ),
  Upload: ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
    </svg>
  ),
  Play: ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polygon points="6 3 20 12 6 21 6 3" />
    </svg>
  ),
  Pause: ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="14" y="4" width="4" height="16" rx="1" /><rect x="6" y="4" width="4" height="16" rx="1" />
    </svg>
  ),
  X: ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  ),
  Sun: ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  ),
  Moon: ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </svg>
  ),
  Sparkles: ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
    </svg>
  )
};

// ============================================================================
// COMPONENT CHÍNH
// ============================================================================
export default function FamilyPhotoArchive() {
  const [photos, setPhotos] = useState(INITIAL_PHOTOS);
  const [darkMode, setDarkMode] = useState(true);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'favorites' | 'upload'
  const [selectedCategory, setSelectedCategory] = useState('Tất cả');
  const [selectedYear, setSelectedYear] = useState('Tất cả');
  
  // Trạng thái tương tác nội bộ
  const [likedPhotos, setLikedPhotos] = useState([2, 5, 6]); // ID của các bức ảnh đã thích sẵn
  const [selectedPhoto, setSelectedPhoto] = useState(null); // Cho Lightbox hiển thị chi tiết
  
  // Trạng thái Slideshow (Memory Lane)
  const [isSlideshowPlaying, setIsSlideshowPlaying] = useState(false);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  
  // Trạng thái Form Upload Tạm Thời
  const [newPhoto, setNewPhoto] = useState({
    title: '', description: '', category: 'Thường nhật', year: 2026, date: '', location: '', src: ''
  });
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  // Điều khiển hiệu ứng Slideshow tự động chạy qua thời gian
  useEffect(() => {
    let interval;
    if (isSlideshowPlaying) {
      interval = setInterval(() => {
        setCurrentSlideIndex((prevIndex) => (prevIndex + 1) % filteredPhotos.length);
      }, 4000); // 4 giây đổi ảnh một lần
    }
    return () => clearInterval(interval);
  }, [isSlideshowPlaying, photos, selectedCategory, selectedYear, activeTab]);

  // Xử lý Lọc Ảnh dựa trên Tab, Danh mục và Dòng thời gian (Năm)
  const filteredPhotos = photos.filter(photo => {
    const matchTab = activeTab === 'favorites' ? likedPhotos.includes(photo.id) : true;
    const matchCategory = selectedCategory === 'Tất cả' ? true : photo.category === selectedCategory;
    const matchYear = selectedYear === 'Tất cả' ? true : photo.year === Number(selectedYear);
    return matchTab && matchCategory && matchYear;
  });

  // Chức năng Thả Tim (Like)
  const handleToggleLike = (id, e) => {
    if (e) e.stopPropagation(); // Tránh kích hoạt mở Lightbox
    if (likedPhotos.includes(id)) {
      setLikedPhotos(likedPhotos.filter(pId => pId !== id));
      setPhotos(photos.map(p => p.id === id ? { ...p, likes: p.likes - 1 } : p));
    } else {
      setLikedPhotos([...likedPhotos, id]);
      setPhotos(photos.map(p => p.id === id ? { ...p, likes: p.likes + 1 } : p));
    }
  };

  // Xử lý tệp hình ảnh tải lên cục bộ qua FileReader
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewPhoto({ ...newPhoto, src: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  // Kéo thả file
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewPhoto({ ...newPhoto, src: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  // Lưu bức ảnh mới vào danh sách bộ nhớ tạm thời
  const handleSavePhoto = (e) => {
    e.preventDefault();
    if (!newPhoto.src || !newPhoto.title) {
      alert("Vui lòng tải ảnh lên và nhập tiêu đề đầy đủ quý giá nhé!");
      return;
    }
    const createdPhoto = {
      ...newPhoto,
      id: Date.now(),
      likes: 0,
      year: newPhoto.date ? new Date(newPhoto.date).getFullYear() : 2026
    };
    setPhotos([createdPhoto, ...photos]);
    setActiveTab('all');
    // Reset Form
    setNewPhoto({ title: '', description: '', category: 'Thường nhật', year: 2026, date: '', location: '', src: '' });
  };

  return (
    <div className={`min-h-screen transition-colors duration-700 font-sans ${darkMode ? 'bg-slate-950 text-stone-100' : 'bg-stone-50 text-slate-900'}`}>
      
      {/* TRANG TRÍ NỀN PHONG CÁCH HOÀNG HÔN MƠ MÀNG */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-gradient-to-br from-amber-500/10 to-rose-500/10 rounded-full filter blur-[120px] pointer-events-none mix-blend-screen" />
      <div className="absolute bottom-10 right-1/4 w-[600px] h-[600px] bg-gradient-to-tr from-blue-500/5 to-purple-500/10 rounded-full filter blur-[150px] pointer-events-none mix-blend-screen" />

      {/* HEADER ỨNG DỤNG */}
      <header className={`sticky top-0 z-40 backdrop-blur-md transition-all border-b ${darkMode ? 'bg-slate-950/70 border-slate-800' : 'bg-stone-50/70 border-stone-200'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          {/* Logo & Slogan */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => { setActiveTab('all'); setSelectedCategory('Tất cả'); setSelectedYear('Tất cả'); }}>
            <div className="p-2.5 bg-gradient-to-tr from-amber-500 to-rose-500 rounded-2xl text-white shadow-lg shadow-rose-500/20 animate-pulse">
              <Icons.Camera className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-amber-500 via-rose-500 to-orange-400 bg-clip-text text-transparent">
                Kỷ Niệm Gia Đình
              </h1>
              <p className={`text-xs ${darkMode ? 'text-stone-400' : 'text-slate-500'}`}>Nơi lưu giữ từng khoảnh khắc thiêng liêng</p>
            </div>
          </div>

          {/* Điều Hướng Chế Độ Tab và Sáng/Tối */}
          <div className="flex items-center gap-2 sm:gap-4">
            <nav className={`flex p-1 rounded-full border ${darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-stone-100 border-stone-200'}`}>
              <button 
                onClick={() => setActiveTab('all')}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-300 ${activeTab === 'all' ? 'bg-gradient-to-r from-amber-500 to-rose-500 text-white shadow' : 'hover:opacity-70'}`}
              >
                Kho Ảnh
              </button>
              <button 
                onClick={() => setActiveTab('favorites')}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-300 flex items-center gap-1.5 ${activeTab === 'favorites' ? 'bg-gradient-to-r from-amber-500 to-rose-500 text-white shadow' : 'hover:opacity-70'}`}
              >
                <Icons.Heart className="w-4 h-4" filled={activeTab === 'favorites'} />
                <span className="hidden sm:inline">Yêu Thích</span>
              </button>
              <button 
                onClick={() => setActiveTab('upload')}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-300 flex items-center gap-1.5 ${activeTab === 'upload' ? 'bg-gradient-to-r from-amber-500 to-rose-500 text-white shadow' : 'hover:opacity-70'}`}
              >
                <Icons.Upload className="w-4 h-4" />
                <span className="hidden sm:inline">Thêm Kỷ Niệm</span>
              </button>
            </nav>

            {/* Nút Đổi Theme Sáng / Tối */}
            <button 
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2.5 rounded-full border transition-transform active:scale-95 ${darkMode ? 'bg-slate-900 border-slate-800 text-amber-400' : 'bg-white border-stone-200 text-slate-700 shadow-sm'}`}
            >
              {darkMode ? <Icons.Sun className="w-5 h-5" /> : <Icons.Moon className="w-5 h-5" />}
            </button>
          </div>

        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">

        {/* ====================================================================
            TAB CHÍNH: HIỂN THỊ KHO ẢNH HOẶC THƯ MỤC YÊU THÍCH
            ==================================================================== */}
        {(activeTab === 'all' || activeTab === 'favorites') && (
          <>
            {/* HERO BANNER - KHÔNG GIAN SỐNG ĐỘNG */}
            <div className="text-center max-w-2xl mx-auto mb-10 transition-all duration-500">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium mb-3 bg-rose-500/10 text-rose-400 border border-rose-500/20">
                <Icons.Sparkles className="w-3.5 h-3.5" />
                {activeTab === 'all' ? 'Tất Cả Kỷ Niệm Thân Thương' : 'Góc Kỷ Niệm Được Yêu Thích Nhất'}
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-3">
                {activeTab === 'all' ? 'Dòng Thời Gian Hạnh Phúc' : 'Nơi Lưu Giữ Trọn Con Tim'}
              </h2>
              <p className={`text-sm ${darkMode ? 'text-stone-400' : 'text-slate-600'}`}>
                Mỗi bức ảnh là một câu chuyện tình thân thiêng liêng. Hãy để thời gian ngừng trôi trong từng khoảnh khắc gia đình ta.
              </p>
              
              {/* Nút Bật Trình Chiếu Slideshow (Chỉ khi có ảnh) */}
              {filteredPhotos.length > 0 && (
                <button
                  onClick={() => { setIsSlideshowPlaying(true); setCurrentSlideIndex(0); }}
                  className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white font-medium rounded-full shadow-lg shadow-rose-500/15 transition-transform active:scale-95"
                >
                  <Icons.Play className="w-4 h-4 fill-white" /> Khởi Chiếu Lưới Kỷ Niệm
                </button>
              )}
            </div>

            {/* BỘ LỌC THÔNG MINH - CHỦ ĐỀ & TRỤC THỜI GIAN */}
            <div className={`p-5 rounded-3xl border mb-8 transition-all duration-300 shadow-sm ${darkMode ? 'bg-slate-900/60 border-slate-800/80 backdrop-blur' : 'bg-white border-stone-200'}`}>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                
                {/* Lọc danh mục */}
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider block mb-2 opacity-60">Chủ đề kỷ niệm</span>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all ${
                          selectedCategory === cat
                            ? 'bg-amber-500 text-white shadow-sm shadow-amber-500/20'
                            : darkMode ? 'bg-slate-800 hover:bg-slate-700 text-stone-300' : 'bg-stone-100 hover:bg-stone-200 text-slate-700'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Trục Dòng Thời Gian Trực Quan (Năm) */}
                <div className="min-w-[240px]">
                  <span className="text-xs font-semibold uppercase tracking-wider block mb-2 opacity-60">Dòng thời gian (Năm)</span>
                  <div className="relative flex items-center justify-between p-1 rounded-xl bg-black/5 dark:bg-black/20 border border-stone-200 dark:border-slate-800">
                    {YEARS.map((yr) => (
                      <button
                        key={yr}
                        onClick={() => setSelectedYear(yr)}
                        className={`flex-1 text-center py-1.5 rounded-lg text-xs font-bold transition-all relative z-10 ${
                          selectedYear === yr 
                            ? 'text-white bg-gradient-to-r from-amber-500 to-orange-500 shadow-sm'
                            : 'opacity-70 hover:opacity-100'
                        }`}
                      >
                        {yr}
                      </button>
                    ))}
                  </div>
                </div>

              </div>
            </div>

            {/* LƯỚI TRƯNG BÀY ẢNH DẠNG MASONRY TỰ NHIÊN */}
            {filteredPhotos.length > 0 ? (
              <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6 transition-all duration-500 animate-fade-in">
                {filteredPhotos.map((photo) => {
                  const isLiked = likedPhotos.includes(photo.id);
                  return (
                    <div
                      key={photo.id}
                      onClick={() => setSelectedPhoto(photo)}
                      className={`break-inside-avoid group relative rounded-2xl overflow-hidden cursor-pointer border shadow-md hover:shadow-xl transition-all duration-500 hover:-translate-y-1 ${
                        darkMode ? 'bg-slate-900 border-slate-800/80' : 'bg-white border-stone-200'
                      }`}
                    >
                      {/* Vùng Ảnh */}
                      <div className="relative overflow-hidden aspect-auto max-h-[500px]">
                        <img 
                          src={photo.src} 
                          alt={photo.title}
                          className="w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                          loading="lazy"
                        />
                        {/* Lớp phủ Gradient mờ quyến rũ khi di chuột vào */}
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-400 flex flex-col justify-end p-5" />
                        
                        {/* Nhãn thể loại nhanh ở góc */}
                        <span className="absolute top-3 left-3 px-2.5 py-1 text-[11px] font-semibold tracking-wide uppercase bg-slate-950/60 backdrop-blur-md text-amber-400 rounded-full border border-white/10">
                          {photo.category}
                        </span>

                        {/* Nút Like nhanh */}
                        <button
                          onClick={(e) => handleToggleLike(photo.id, e)}
                          className={`absolute top-3 right-3 p-2.5 rounded-full backdrop-blur-md border transition-all active:scale-95 duration-300 ${
                            isLiked 
                              ? 'bg-rose-500 border-rose-400 text-white' 
                              : 'bg-slate-950/40 border-white/10 text-white hover:bg-rose-500/20'
                          }`}
                        >
                          <Icons.Heart className="w-4 h-4" filled={isLiked} />
                        </button>
                      </div>

                      {/* Vùng Thông Tin Mô Tả Bên Dưới */}
                      <div className="p-5">
                        <div className="flex items-center justify-between gap-2 text-xs mb-1.5 opacity-60">
                          <span className="flex items-center gap-1">
                            <Icons.Calendar className="w-3.5 h-3.5" />
                            {photo.date}
                          </span>
                          <span className="flex items-center gap-1">
                            <Icons.MapPin className="w-3.5 h-3.5" />
                            {photo.location}
                          </span>
                        </div>
                        <h3 className="text-lg font-bold tracking-tight mb-1 group-hover:text-amber-500 transition-colors">
                          {photo.title}
                        </h3>
                        <p className={`text-xs line-clamp-2 leading-relaxed ${darkMode ? 'text-stone-400' : 'text-slate-600'}`}>
                          {photo.description}
                        </p>
                        
                        <div className="mt-4 pt-3 border-t border-dashed dark:border-slate-800 border-stone-200 flex items-center justify-between text-xs">
                          <span className="font-semibold px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 dark:text-amber-400">
                            Năm {photo.year}
                          </span>
                          <span className="flex items-center gap-1 opacity-70">
                            <Icons.Heart className="w-3.5 h-3.5 fill-rose-500 stroke-rose-500" /> {photo.likes} lượt thích
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* TRẠNG THÁI TRỐNG RỖNG VỚI HOẠT HỌA TRÁI TIM BAY BỔNG */
              <div className="text-center py-20 max-w-md mx-auto animate-fade-in">
                <div className="relative inline-block mb-4">
                  <div className="w-20 h-20 bg-amber-500/10 dark:bg-amber-500/5 rounded-full flex items-center justify-center text-amber-500">
                    <Icons.Camera className="w-10 h-10" />
                  </div>
                  <div className="absolute top-0 right-0 animate-bounce">
                    <Icons.Heart className="w-6 h-6 fill-rose-500 text-rose-500" />
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-2">Chưa tìm thấy kỷ niệm nào</h3>
                <p className={`text-sm mb-6 ${darkMode ? 'text-stone-400' : 'text-slate-600'}`}>
                  Có vẻ như gia đình mình chưa lọc đúng album hoặc chưa tải ảnh lên cho mục này.
                </p>
                <button
                  onClick={() => { setSelectedCategory('Tất cả'); setSelectedYear('Tất cả'); setActiveTab('all'); }}
                  className="px-5 py-2 bg-stone-200 dark:bg-slate-800 rounded-full text-xs font-semibold hover:opacity-80 transition-all"
                >
                  Xoá Bộ Lọc Kính
                </button>
              </div>
            )}
          </>
        )}

        {/* ====================================================================
            TAB CHÍNH: KHU VỰC TẢI ẢNH MỚI LÊN (BỘ NHỚ TẠM THỜI)
            ==================================================================== */}
        {activeTab === 'upload' && (
          <div className="max-w-3xl mx-auto animate-fade-in">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-extrabold tracking-tight mb-2">Khắc Ghi Kỷ Niệm Mới</h2>
              <p className={`text-sm ${darkMode ? 'text-stone-400' : 'text-slate-600'}`}>
                Tải lên những bức hình gia đình vô giá và ghi lại câu chuyện yêu thương phía sau nó.
              </p>
            </div>

            <form onSubmit={handleSavePhoto} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Khu Vực Kéo Thả Ảnh Trực Quan */}
              <div 
                className={`border-2 border-dashed rounded-3xl p-6 flex flex-col items-center justify-center text-center transition-all min-h-[320px] relative ${
                  dragActive ? 'border-amber-500 bg-amber-500/5' : darkMode ? 'border-slate-800 bg-slate-900/40' : 'border-stone-300 bg-white'
                } ${newPhoto.src ? 'p-2' : ''}`}
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
              >
                {newPhoto.src ? (
                  <div className="w-full h-full relative rounded-2xl overflow-hidden aspect-video md:aspect-auto md:min-h-[300px]">
                    <img src={newPhoto.src} alt="Bản xem trước" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setNewPhoto({ ...newPhoto, src: '' })}
                      className="absolute top-3 right-3 p-2 bg-slate-950/80 text-white rounded-full hover:bg-red-500 transition-colors"
                    >
                      <Icons.X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="p-4 bg-gradient-to-tr from-amber-500/10 to-rose-500/10 rounded-2xl text-amber-500 mb-4">
                      <Icons.Upload className="w-8 h-8" />
                    </div>
                    <p className="text-sm font-semibold mb-1">Kéo và thả ảnh gia đình vào đây</p>
                    <p className="text-xs opacity-60 mb-4">Hoặc nhấn để chọn tệp tin từ thiết bị</p>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current.click()}
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold rounded-xl transition-all shadow-md shadow-amber-500/15"
                    >
                      Chọn File Ảnh
                    </button>
                  </>
                )}
                <input 
                  ref={fileInputRef}
                  type="file" 
                  accept="image/*" 
                  onChange={handleFileChange} 
                  className="hidden" 
                />
              </div>

              {/* Khu Vực Nhập Thông Tin Câu Chuyện */}
              <div className={`p-6 rounded-3xl border flex flex-col justify-between ${darkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-stone-200'}`}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider opacity-70 mb-1.5">Tiêu đề kỷ niệm *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Ví dụ: Cả nhà đi dạo Hồ Gươm..." 
                      value={newPhoto.title}
                      onChange={(e) => setNewPhoto({ ...newPhoto, title: e.target.value })}
                      className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all ${
                        darkMode ? 'bg-slate-950 border-slate-800 focus:border-amber-500' : 'bg-stone-50 border-stone-200 focus:border-amber-500'
                      }`}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider opacity-70 mb-1.5">Chủ đề</label>
                      <select
                        value={newPhoto.category}
                        onChange={(e) => setNewPhoto({ ...newPhoto, category: e.target.value })}
                        className={`w-full px-3 py-2.5 rounded-xl border text-sm outline-none ${
                          darkMode ? 'bg-slate-950 border-slate-800' : 'bg-stone-50 border-stone-200'
                        }`}
                      >
                        {CATEGORIES.filter(c => c !== "Tất cả").map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider opacity-70 mb-1.5">Ngày lưu niệm</label>
                      <input 
                        type="date" 
                        value={newPhoto.date}
                        onChange={(e) => setNewPhoto({ ...newPhoto, date: e.target.value })}
                        className={`w-full px-3 py-2.5 rounded-xl border text-sm outline-none ${
                          darkMode ? 'bg-slate-950 border-slate-800' : 'bg-stone-50 border-stone-200'
                        }`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider opacity-70 mb-1.5">Địa điểm chụp</label>
                    <input 
                      type="text" 
                      placeholder="Ví dụ: Sapa, Lào Cai" 
                      value={newPhoto.location}
                      onChange={(e) => setNewPhoto({ ...newPhoto, location: e.target.value })}
                      className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none ${
                        darkMode ? 'bg-slate-950 border-slate-800' : 'bg-stone-50 border-stone-200'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider opacity-70 mb-1.5">Câu chuyện kỷ niệm</label>
                    <textarea 
                      rows="3"
                      placeholder="Ghi lại dòng cảm xúc chân thật, lời chúc hoặc khoảnh khắc hài hước lúc đó..." 
                      value={newPhoto.description}
                      onChange={(e) => setNewPhoto({ ...newPhoto, description: e.target.value })}
                      className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none resize-none ${
                        darkMode ? 'bg-slate-950 border-slate-800 focus:border-amber-500' : 'bg-stone-50 border-stone-200 focus:border-amber-500'
                      }`}
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setActiveTab('all')}
                    className="flex-1 py-2.5 rounded-xl text-xs font-bold border hover:bg-black/5 dark:hover:bg-white/5 transition-all"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 via-rose-500 to-orange-500 hover:opacity-90 text-white shadow-lg transition-all"
                  >
                    Lưu Vào Thư Mục
                  </button>
                </div>

              </div>
            </form>
          </div>
        )}

      </main>

      {/* FOOTER */}
      <footer className={`mt-20 border-t py-8 text-center text-xs opacity-60 ${darkMode ? 'border-slate-900' : 'border-stone-200'}`}>
        <p>© {new Date().getFullYear()} Góc Kỷ Niệm Gia Đình - Được thiết kế bằng trọn tình yêu thương.</p>
      </footer>

      {/* ====================================================================
          MẢNG ĐẶC BIỆT 1: INTERACTIVE LIGHTBOX MODAL (XEM CHI TIẾT ẢNH)
          ==================================================================== */}
      {selectedPhoto && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xl animate-fade-in"
          onClick={() => setSelectedPhoto(null)}
        >
          <div 
            className={`w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[90vh] md:max-h-[80vh] border animate-scale-in ${
              darkMode ? 'bg-slate-900 border-slate-800 text-stone-100' : 'bg-white border-stone-100 text-slate-900'
            }`}
            onClick={(e) => e.stopPropagation()} // Ngăn chặn đóng khi bấm bên trong khối modal
          >
            {/* Ảnh Toàn Màn Hình */}
            <div className="flex-1 bg-black flex items-center justify-center relative min-h-[250px] md:min-h-0">
              <img 
                src={selectedPhoto.src} 
                alt={selectedPhoto.title} 
                className="w-full h-full object-contain max-h-[40vh] md:max-h-[80vh]"
              />
              <span className="absolute top-4 left-4 px-3 py-1 bg-black/60 rounded-full text-xs text-amber-400 font-semibold uppercase tracking-wider">
                {selectedPhoto.category}
              </span>
            </div>

            {/* Thông Tin Câu Chuyện Chi Tiết Chiếm Một Nửa Tỷ Lệ */}
            <div className="w-full md:w-[360px] p-6 flex flex-col justify-between overflow-y-auto">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="inline-block px-2.5 py-0.5 bg-amber-500/10 text-amber-500 rounded text-xs font-bold mb-1">
                      Năm {selectedPhoto.year}
                    </span>
                    <h3 className="text-2xl font-extrabold tracking-tight">{selectedPhoto.title}</h3>
                  </div>
                  <button 
                    onClick={() => setSelectedPhoto(null)}
                    className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                  >
                    <Icons.X className="w-5 h-5" />
                  </button>
                </div>

                {/* Siêu dữ liệu bổ sung */}
                <div className="space-y-2 mb-4 text-xs opacity-70">
                  <div className="flex items-center gap-2">
                    <Icons.Calendar className="w-4 h-4 text-rose-500" />
                    <span>Ngày ghi dấu: <strong>{selectedPhoto.date}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Icons.MapPin className="w-4 h-4 text-amber-500" />
                    <span>Chụp tại: <strong>{selectedPhoto.location}</strong></span>
                  </div>
                </div>

                <hr className="my-3 border-stone-200 dark:border-slate-800" />

                {/* Câu chuyện tâm tình dài lâu */}
                <p className={`text-sm leading-relaxed ${darkMode ? 'text-stone-300' : 'text-slate-700'}`}>
                  {selectedPhoto.description}
                </p>
              </div>

              {/* Thanh Tương Tác Dưới Cùng */}
              <div className="mt-8 pt-4 border-t dark:border-slate-800 border-stone-200 flex items-center justify-between">
                <button
                  onClick={() => handleToggleLike(selectedPhoto.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition-all active:scale-95 ${
                    likedPhotos.includes(selectedPhoto.id)
                      ? 'bg-rose-500 border-rose-400 text-white'
                      : 'hover:bg-black/5 dark:hover:bg-white/10'
                  }`}
                >
                  <Icons.Heart className="w-4 h-4" filled={likedPhotos.includes(selectedPhoto.id)} />
                  {likedPhotos.includes(selectedPhoto.id) ? 'Đã yêu thích' : 'Thả tim kỷ niệm'}
                </button>
                <span className="text-xs font-medium opacity-60">
                  {selectedPhoto.likes} trái tim ấm
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          MẢNG ĐẶC BIỆT 2: TRÌNH CHIẾU TỰ ĐỘNG KHÔNG GIAN KỶ NIỆM (SLIDESHOW)
          ==================================================================== */}
      {isSlideshowPlaying && filteredPhotos.length > 0 && (
        <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col justify-between p-4 sm:p-8 animate-fade-in">
          
          {/* Thanh Điều Khiển Trên Cùng */}
          <div className="flex justify-between items-center z-10">
            <div className="text-white">
              <p className="text-xs text-amber-400 font-bold tracking-widest uppercase">Đang Trình Chiếu Kỷ Niệm</p>
              <h4 className="text-sm font-medium opacity-70">Khoảnh khắc {currentSlideIndex + 1} trên tổng số {filteredPhotos.length}</h4>
            </div>
            <button
              onClick={() => setIsSlideshowPlaying(false)}
              className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur transition-all"
            >
              <Icons.X className="w-6 h-6" />
            </button>
          </div>

          {/* Khung Hiển Thị Ảnh Lướt Fade-In/Out */}
          <div className="flex-1 flex items-center justify-center my-4 relative overflow-hidden">
            <div className="absolute inset-0 filter blur-3xl opacity-20 scale-125 pointer-events-none">
              <img 
                src={filteredPhotos[currentSlideIndex].src} 
                alt="Bkg Blur" 
                className="w-full h-full object-cover" 
              />
            </div>
            
            {/* Ảnh Chiếu Chính */}
            <div className="max-w-4xl max-h-[60vh] rounded-2xl overflow-hidden shadow-2xl relative group animate-scale-in key={currentSlideIndex}">
              <img 
                src={filteredPhotos[currentSlideIndex].src} 
                alt={filteredPhotos[currentSlideIndex].title} 
                className="max-w-full max-h-[60vh] object-contain"
              />
            </div>
          </div>

          {/* Dòng Mô Tả Trôi Bên Dưới Cho Cả Nhà Chiêm Ngưỡng */}
          <div className="max-w-2xl mx-auto text-center text-white z-10 mb-6 bg-black/40 p-6 rounded-2xl backdrop-blur-md border border-white/5">
            <span className="px-2.5 py-0.5 bg-amber-500 text-black font-bold text-[10px] rounded uppercase mb-2 inline-block">
              {filteredPhotos[currentSlideIndex].category} • Năm {filteredPhotos[currentSlideIndex].year}
            </span>
            <h3 className="text-2xl font-bold tracking-tight mb-2 text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-rose-300">
              {filteredPhotos[currentSlideIndex].title}
            </h3>
            <p className="text-sm text-stone-300 leading-relaxed max-w-xl mx-auto">
              "{filteredPhotos[currentSlideIndex].description}"
            </p>
            <div className="mt-2 text-xs text-amber-400 font-semibold flex items-center justify-center gap-1.5">
              <Icons.MapPin className="w-3.5 h-3.5" /> {filteredPhotos[currentSlideIndex].location}
            </div>
          </div>

          {/* Thanh Tiến Trình / Điều Hướng Slide Dưới Cùng */}
          <div className="max-w-md mx-auto w-full flex items-center justify-between gap-4 z-10">
            <button
              onClick={() => setCurrentSlideIndex((prev) => (prev - 1 + filteredPhotos.length) % filteredPhotos.length)}
              className="text-white hover:text-amber-400 p-2 transition-colors"
            >
              ◀ Trước
            </button>
            
            {/* Nút Play/Pause Giữa Chừng */}
            <button
              onClick={() => setIsSlideshowPlaying(!isSlideshowPlaying)}
              className="p-3 bg-amber-500 hover:bg-amber-600 text-black rounded-full shadow-lg transition-transform active:scale-95"
            >
              {isSlideshowPlaying ? <Icons.Pause className="w-5 h-5 fill-black" /> : <Icons.Play className="w-5 h-5 fill-black" />}
            </button>

            <button
              onClick={() => setCurrentSlideIndex((prev) => (prev + 1) % filteredPhotos.length)}
              className="text-white hover:text-amber-400 p-2 transition-colors"
            >
              Tiếp ▶
            </button>
          </div>

        </div>
      )}

    </div>
  );
}