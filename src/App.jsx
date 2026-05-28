import React, { useState, useEffect, useRef } from 'react';

// ============================================================================
// DATA MẪU BAN ĐẦU (Hình ảnh chất lượng cao kèm Album mặc định)
// ============================================================================
const INITIAL_ALBUMS = [
  { id: "album-1", name: "Ngày Lễ Sum Vầy", description: "Các dịp Tết, Giáng Sinh, họp mặt gia đình lớn" },
  { id: "album-2", name: "Sinh Nhật Đáng Nhớ", description: "Kỷ niệm tuổi mới của các thành viên" },
  { id: "album-3", name: "Hành Trình Du Lịch", description: "Khám phá thế giới cùng nhau" },
  { id: "album-4", name: "Khoảnh Khắc Thường Nhật", description: "Những niềm vui nhỏ bé mỗi ngày" }
];

const INITIAL_PHOTOS = [
  {
    id: 1,
    title: "Tết Sum Vầy 2024",
    description: "Cả nhà cùng nhau gói bánh chưng xanh, tiếng cười rộn rã khắp sân nhà mùng 1 Tết.",
    albumId: "album-1",
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
    albumId: "album-2",
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
    albumId: "album-3",
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
    albumId: "album-4",
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
    albumId: "album-1",
    year: 2025,
    date: "2025-12-24",
    location: "Đà Lạt",
    likes: 31,
    src: "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=1200&q=80"
  }
];

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
  Trash: ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2M10 11v6M14 11v6" />
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
  Folder: ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
    </svg>
  ),
  Plus: ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M5 12h14M12 5v14" />
    </svg>
  )
};

export default function FamilyPhotoArchive() {
  const [photos, setPhotos] = useState(INITIAL_PHOTOS);
  const [albums, setAlbums] = useState(INITIAL_ALBUMS);
  const [darkMode, setDarkMode] = useState(true);
  
  // Điều hướng chính: 'gallery' (Kho ảnh/Yêu thích) | 'albums' (Quản lý Album) | 'upload' (Tải ảnh)
  const [activeTab, setActiveTab] = useState('gallery'); 
  const [subFilter, setSubFilter] = useState('all'); // 'all' | 'favorites'

  // Trạng thái bộ lọc tìm kiếm ảnh
  const [selectedAlbumId, setSelectedAlbumId] = useState('Tất cả');
  const [selectedYear, setSelectedYear] = useState('Tất cả');
  
  // Trạng thái tương tác nội bộ
  const [likedPhotos, setLikedPhotos] = useState([2, 5]); 
  const [selectedPhoto, setSelectedPhoto] = useState(null); 
  
  // Trạng thái Slideshow 
  const [isSlideshowPlaying, setIsSlideshowPlaying] = useState(false);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  
  // Trạng thái tạo Album mới
  const [showNewAlbumModal, setShowNewAlbumModal] = useState(false);
  const [newAlbumData, setNewAlbumData] = useState({ name: '', description: '' });

  // Trạng thái Form Upload Ảnh mới
  const [newPhoto, setNewPhoto] = useState({
    title: '', description: '', albumId: INITIAL_ALBUMS[0]?.id || '', year: 2026, date: '', location: '', src: ''
  });
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  // Tự động chạy Slideshow
  useEffect(() => {
    let interval;
    if (isSlideshowPlaying && filteredPhotos.length > 0) {
      interval = setInterval(() => {
        setCurrentSlideIndex((prev) => (prev + 1) % filteredPhotos.length);
      }, 4000);
    }
    return () => clearInterval(interval);
  }, [isSlideshowPlaying, photos, selectedAlbumId, selectedYear, subFilter]);

  // Bộ lọc ảnh thông minh dựa theo Album, Năm, và mục Yêu thích
  const filteredPhotos = photos.filter(photo => {
    const matchTab = subFilter === 'favorites' ? likedPhotos.includes(photo.id) : true;
    const matchAlbum = selectedAlbumId === 'Tất cả' ? true : photo.albumId === selectedAlbumId;
    const matchYear = selectedYear === 'Tất cả' ? true : photo.year === Number(selectedYear);
    return matchTab && matchAlbum && matchYear;
  });

  // Tương tác Thả tim
  const handleToggleLike = (id, e) => {
    if (e) e.stopPropagation();
    if (likedPhotos.includes(id)) {
      setLikedPhotos(likedPhotos.filter(pId => pId !== id));
      setPhotos(photos.map(p => p.id === id ? { ...p, likes: p.likes - 1 } : p));
    } else {
      setLikedPhotos([...likedPhotos, id]);
      setPhotos(photos.map(p => p.id === id ? { ...p, likes: p.likes + 1 } : p));
    }
  };

  // XÓA HÌNH ẢNH HOÀN TOÀN
  const handleDeletePhoto = (id, e) => {
    if (e) e.stopPropagation();
    if (confirm("Biết bao kỷ niệm quý giá trong ảnh này sẽ mất đi, bạn có chắc chắn muốn xóa không?")) {
      setPhotos(photos.filter(photo => photo.id !== id));
      setLikedPhotos(likedPhotos.filter(pId => pId !== id));
      if (selectedPhoto && selectedPhoto.id === id) {
        setSelectedPhoto(null);
      }
    }
  };

  // THÊM ALBUM MỚI
  const handleCreateAlbum = (e) => {
    e.preventDefault();
    if (!newAlbumData.name.trim()) return;
    
    const newAlbum = {
      id: `album-${Date.now()}`,
      name: newAlbumData.name,
      description: newAlbumData.description
    };
    
    setAlbums([...albums, newAlbum]);
    setNewAlbumData({ name: '', description: '' });
    setShowNewAlbumModal(false);
  };

  // XÓA ALBUM HOÀN TOÀN (Và tùy chọn xử lý các ảnh bên trong)
  const handleDeleteAlbum = (albumId, e) => {
    if (e) e.stopPropagation();
    if (confirm("Xóa album này sẽ xóa toàn bộ danh mục phân loại! Các bức ảnh thuộc album này sẽ được chuyển về trạng thái 'Chưa phân loại'. Bạn có muốn tiếp tục?")) {
      // Xóa album
      setAlbums(albums.filter(a => a.id !== albumId));
      // Cập nhật các bức ảnh thuộc album đó thành rỗng (Chưa phân loại)
      setPhotos(photos.map(p => p.albumId === albumId ? { ...p, albumId: '' } : p));
      if (selectedAlbumId === albumId) setSelectedAlbumId('Tất cả');
    }
  };

  // Xử lý đọc file ảnh tải lên kéo thả
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setNewPhoto({ ...newPhoto, src: reader.result });
      reader.readAsDataURL(file);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault(); e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault(); e.stopPropagation(); setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const reader = new FileReader();
      reader.onloadend = () => setNewPhoto({ ...newPhoto, src: reader.result });
      reader.readAsDataURL(file);
    }
  };

  // LƯU ẢNH MỚI VÀO STATE KHỞI TẠO TẠM THỜI
  const handleSavePhoto = (e) => {
    e.preventDefault();
    if (!newPhoto.src || !newPhoto.title) {
      alert("Vui lòng tải ảnh lên và viết tiêu đề kỷ niệm nhé!");
      return;
    }
    const createdPhoto = {
      ...newPhoto,
      id: Date.now(),
      likes: 0,
      year: newPhoto.date ? new Date(newPhoto.date).getFullYear() : 2026
    };
    setPhotos([createdPhoto, ...photos]);
    setActiveTab('gallery');
    setSubFilter('all');
    // Reset Form
    setNewPhoto({ title: '', description: '', albumId: albums[0]?.id || '', year: 2026, date: '', location: '', src: '' });
  };

  return (
    <div className={`min-h-screen transition-colors duration-700 font-sans ${darkMode ? 'bg-slate-950 text-stone-100' : 'bg-stone-50 text-slate-900'}`}>
      
      {/* BACKGROUND DECORATIONS */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-gradient-to-br from-amber-500/10 to-rose-500/10 rounded-full filter blur-[120px] pointer-events-none mix-blend-screen" />
      <div className="absolute bottom-10 right-1/4 w-[600px] h-[600px] bg-gradient-to-tr from-blue-500/5 to-purple-500/10 rounded-full filter blur-[150px] pointer-events-none mix-blend-screen" />

      {/* HEADER BAR */}
      <header className={`sticky top-0 z-40 backdrop-blur-md transition-all border-b ${darkMode ? 'bg-slate-950/70 border-slate-800' : 'bg-stone-50/70 border-stone-200'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => { setActiveTab('gallery'); setSubFilter('all'); }}>
            <div className="p-2.5 bg-gradient-to-tr from-amber-500 to-rose-500 rounded-2xl text-white shadow-lg">
              <Icons.Camera className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-amber-500 via-rose-500 to-orange-400 bg-clip-text text-transparent">Góc Kỷ Niệm</h1>
              <p className={`text-xs ${darkMode ? 'text-stone-400' : 'text-slate-500'}`}>Lưu giữ yêu thương</p>
            </div>
          </div>

          {/* THANH ĐIỀU HƯỚNG TABS CHÍNH */}
          <div className="flex items-center gap-3">
            <nav className={`flex p-1 rounded-full border ${darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-stone-100 border-stone-200'}`}>
              <button 
                onClick={() => { setActiveTab('gallery'); setSubFilter('all'); }}
                className={`px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all ${activeTab === 'gallery' && subFilter === 'all' ? 'bg-gradient-to-r from-amber-500 to-rose-500 text-white shadow' : 'hover:opacity-75'}`}
              >
                Kho Ảnh
              </button>
              <button 
                onClick={() => { setActiveTab('gallery'); setSubFilter('favorites'); }}
                className={`px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all ${activeTab === 'gallery' && subFilter === 'favorites' ? 'bg-gradient-to-r from-amber-500 to-rose-500 text-white shadow' : 'hover:opacity-75'}`}
              >
                Yêu Thích
              </button>
              <button 
                onClick={() => setActiveTab('albums')}
                className={`px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all ${activeTab === 'albums' ? 'bg-gradient-to-r from-amber-500 to-rose-500 text-white shadow' : 'hover:opacity-75'}`}
              >
                Quản Lý Album
              </button>
            </nav>

            <button 
              onClick={() => setActiveTab('upload')}
              className="hidden sm:flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs rounded-full shadow transition-all"
            >
              <Icons.Upload className="w-4 h-4" /> Tải Ảnh Lên
            </button>

            <button 
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2.5 rounded-full border transition-all ${darkMode ? 'bg-slate-900 border-slate-800 text-amber-400' : 'bg-white border-stone-200 text-slate-700 shadow-sm'}`}
            >
              {darkMode ? <Icons.Sun className="w-4 h-4" /> : <Icons.Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* NỘI DUNG CHÍNH */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">

        {/* ====================================================================
            TAB CHÍNH 1: KHO HÌNH ẢNH MASONRY & YÊU THÍCH
            ==================================================================== */}
        {activeTab === 'gallery' && (
          <>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
              <div>
                <h2 className="text-2xl font-extrabold tracking-tight">
                  {subFilter === 'favorites' ? '💕 Những Khoảnh Khắc Yêu Thích Nhất' : '📸 Dòng Kỷ Niệm Gia Đình'}
                </h2>
                <p className={`text-xs ${darkMode ? 'text-stone-400' : 'text-slate-500'}`}>Tổng cộng {filteredPhotos.length} bức hình quý giá đang được hiển thị</p>
              </div>

              {filteredPhotos.length > 0 && (
                <button
                  onClick={() => { setIsSlideshowPlaying(true); setCurrentSlideIndex(0); }}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-rose-500 text-white font-bold text-xs rounded-full shadow-lg hover:opacity-90 transition-transform active:scale-95"
                >
                  <Icons.Play className="w-4 h-4 fill-white" /> Chiếu Slide Album Này
                </button>
              )}
            </div>

            {/* BỘ LỌC TÌM KIẾM THEO ALBUM VÀ NĂM */}
            <div className={`p-4 rounded-2xl border mb-8 flex flex-col sm:flex-row items-center gap-4 justify-between ${darkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-stone-200 shadow-sm'}`}>
              <div className="w-full sm:w-auto flex flex-wrap items-center gap-2">
                <span className="text-xs opacity-60 font-bold uppercase block sm:inline">Album:</span>
                <select 
                  value={selectedAlbumId}
                  onChange={(e) => setSelectedAlbumId(e.target.value)}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-medium outline-none ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-stone-50 border-stone-200'}`}
                >
                  <option value="Tất cả">✨ Tất cả Album</option>
                  {albums.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  <option value="">📁 Chưa phân loại</option>
                </select>
              </div>

              <div className="w-full sm:w-auto flex flex-wrap items-center gap-2 justify-end">
                <span className="text-xs opacity-60 font-bold uppercase">Năm chụp:</span>
                <div className="flex p-0.5 rounded-lg bg-black/10 dark:bg-black/20 border border-stone-200 dark:border-slate-800">
                  {YEARS.map(yr => (
                    <button
                      key={yr}
                      onClick={() => setSelectedYear(yr)}
                      className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${selectedYear === yr ? 'bg-gradient-to-r from-amber-500 to-rose-500 text-white shadow' : 'opacity-60 hover:opacity-100'}`}
                    >
                      {yr}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* LƯỚI HIỂN THỊ HÌNH ẢNH MASONRY */}
            {filteredPhotos.length > 0 ? (
              <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6">
                {filteredPhotos.map((photo) => {
                  const isLiked = likedPhotos.includes(photo.id);
                  const currentAlbum = albums.find(a => a.id === photo.albumId);
                  return (
                    <div
                      key={photo.id}
                      onClick={() => setSelectedPhoto(photo)}
                      className={`break-inside-avoid group relative rounded-2xl overflow-hidden border shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-1 ${darkMode ? 'bg-slate-900 border-slate-800/80' : 'bg-white border-stone-200'}`}
                    >
                      {/* VÙNG ẢNH VÀ CÁC NÚT HOVER NHANH */}
                      <div className="relative overflow-hidden aspect-auto max-h-[450px]">
                        <img src={photo.src} alt={photo.title} className="w-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/10 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end p-4" />
                        
                        {/* Tên Album góc trên */}
                        <span className="absolute top-3 left-3 px-2.5 py-1 text-[10px] font-bold tracking-wide uppercase bg-slate-950/70 backdrop-blur text-amber-400 rounded-full border border-white/10">
                          {currentAlbum ? currentAlbum.name : 'Chưa phân loại'}
                        </span>

                        {/* Nhóm nút góc bên phải khi di chuột vào hoặc chạm */}
                        <div className="absolute top-3 right-3 flex items-center gap-1.5 z-20">
                          <button
                            onClick={(e) => handleToggleLike(photo.id, e)}
                            className={`p-2 rounded-full backdrop-blur border transition-all active:scale-90 ${isLiked ? 'bg-rose-500 border-rose-400 text-white' : 'bg-slate-950/40 border-white/10 text-white hover:bg-rose-500/20'}`}
                          >
                            <Icons.Heart className="w-3.5 h-3.5" filled={isLiked} />
                          </button>
                          
                          {/* NÚT XÓA ẢNH */}
                          <button
                            onClick={(e) => handleDeletePhoto(photo.id, e)}
                            className="p-2 rounded-full backdrop-blur border bg-slate-950/40 border-white/10 text-stone-300 hover:bg-red-600 hover:text-white transition-all active:scale-90"
                            title="Xóa vĩnh viễn hình ảnh này"
                          >
                            <Icons.Trash className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* CHI TIẾT DƯỚI ẢNH */}
                      <div className="p-4">
                        <div className="flex items-center justify-between text-[11px] mb-1.5 opacity-60">
                          <span className="flex items-center gap-1"><Icons.Calendar className="w-3 h-3" />{photo.date}</span>
                          <span className="flex items-center gap-1"><Icons.MapPin className="w-3 h-3" />{photo.location}</span>
                        </div>
                        <h3 className="text-base font-bold mb-1 group-hover:text-amber-500 transition-colors">{photo.title}</h3>
                        <p className={`text-xs line-clamp-2 ${darkMode ? 'text-stone-400' : 'text-slate-600'}`}>{photo.description}</p>
                        
                        <div className="mt-3 pt-2.5 border-t border-dashed dark:border-slate-800 border-stone-200 flex items-center justify-between text-xs opacity-70">
                          <span className="font-bold text-amber-500">Năm {photo.year}</span>
                          <span className="flex items-center gap-1"><Icons.Heart className="w-3 h-3 fill-rose-500 stroke-rose-500" />{photo.likes} lượt thích</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-20 bg-black/5 dark:bg-black/10 rounded-3xl p-8 border border-dashed dark:border-slate-800">
                <Icons.Camera className="w-12 h-12 mx-auto opacity-30 mb-3" />
                <h3 className="font-bold text-lg mb-1">Chưa có bức ảnh nào</h3>
                <p className="text-xs opacity-60 mb-4">Không tìm thấy ảnh phù hợp với tiêu chí lọc hoặc chưa có ảnh.</p>
                <button onClick={() => { setSelectedAlbumId('Tất cả'); setSelectedYear('Tất cả'); }} className="text-xs font-bold text-amber-500 underline">Xóa các bộ lọc</button>
              </div>
            )}
          </>
        )}

        {/* ====================================================================
            TAB CHÍNH 2: QUẢN LÝ DANH SÁCH ALBUM
            ==================================================================== */}
        {activeTab === 'albums' && (
          <div className="animate-fade-in">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
              <div>
                <h2 className="text-2xl font-extrabold tracking-tight">📁 Quản Lý Thư Mục Album</h2>
                <p className={`text-xs ${darkMode ? 'text-stone-400' : 'text-slate-500'}`}>Tạo mới, chỉnh sửa hoặc dọn dẹp các danh mục lưu trữ kỷ niệm</p>
              </div>
              <button
                onClick={() => setShowNewAlbumModal(true)}
                className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-xs rounded-xl shadow-md"
              >
                <Icons.Plus className="w-4 h-4" /> Tạo Album Mới
              </button>
            </div>

            {/* DANH SÁCH CÁC ALBUM DẠNG BOX */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {albums.map(album => {
                const count = photos.filter(p => p.albumId === album.id).length;
                return (
                  <div 
                    key={album.id}
                    className={`p-6 rounded-2xl border transition-all flex flex-col justify-between group ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-stone-200 shadow-sm'}`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl">
                          <Icons.Folder className="w-6 h-6" />
                        </div>
                        
                        {/* NÚT XÓA ALBUM */}
                        <button
                          onClick={(e) => handleDeleteAlbum(album.id, e)}
                          className="p-2 text-stone-400 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                          title="Xóa Album này"
                        >
                          <Icons.Trash className="w-4 h-4" />
                        </button>
                      </div>

                      <h3 className="text-lg font-bold mb-1.5 group-hover:text-amber-500 transition-colors">{album.name}</h3>
                      <p className={`text-xs line-clamp-3 mb-4 leading-relaxed ${darkMode ? 'text-stone-400' : 'text-slate-600'}`}>{album.description || "Không có mô tả cho album này."}</p>
                    </div>

                    <div className="pt-3 border-t dark:border-slate-800 border-stone-100 flex items-center justify-between text-xs">
                      <span className="font-bold text-rose-500">{count} hình ảnh bên trong</span>
                      <button 
                        onClick={() => { setSelectedAlbumId(album.id); setActiveTab('gallery'); }}
                        className="text-amber-500 hover:underline font-bold"
                      >
                        Xem ảnh →
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ====================================================================
            TAB CHÍNH 3: FORM ĐĂNG ẢNH MỚI LÊN ALBUM LỰA CHỌN
            ==================================================================== */}
        {activeTab === 'upload' && (
          <div className="max-w-3xl mx-auto animate-fade-in">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-extrabold tracking-tight">✨ Khắc Ghi Kỷ Niệm Mới</h2>
              <p className={`text-xs ${darkMode ? 'text-stone-400' : 'text-slate-500'}`}>Tải ảnh lên và phân loại ngay vào các album gia đình thân thương</p>
            </div>

            <form onSubmit={handleSavePhoto} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* DRAG & DROP ZONE */}
              <div 
                className={`border-2 border-dashed rounded-3xl p-6 flex flex-col items-center justify-center text-center transition-all min-h-[320px] relative ${dragActive ? 'border-amber-500 bg-amber-500/5' : darkMode ? 'border-slate-800 bg-slate-900/40' : 'border-stone-300 bg-white'} ${newPhoto.src ? 'p-2' : ''}`}
                onDragEnter={handleDrag} onDragOver={handleDrag} onDragLeave={handleDrag} onDrop={handleDrop}
              >
                {newPhoto.src ? (
                  <div className="w-full h-full relative rounded-2xl overflow-hidden aspect-video md:aspect-auto md:min-h-[300px]">
                    <img src={newPhoto.src} alt="Preview" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => setNewPhoto({ ...newPhoto, src: '' })} className="absolute top-3 right-3 p-2 bg-slate-950/80 text-white rounded-full hover:bg-red-500 transition-colors"><Icons.X className="w-4 h-4" /></button>
                  </div>
                ) : (
                  <>
                    <div className="p-4 bg-amber-500/10 text-amber-500 rounded-2xl mb-3"><Icons.Upload className="w-7 h-7" /></div>
                    <p className="text-xs font-bold mb-1">Kéo thả ảnh gia đình vào vùng này</p>
                    <p className="text-[11px] opacity-60 mb-4">Định dạng JPG, PNG, WEBP...</p>
                    <button type="button" onClick={() => fileInputRef.current.click()} className="px-4 py-2 bg-amber-500 text-black text-xs font-bold rounded-xl shadow-md">Chọn File Ảnh</button>
                  </>
                )}
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
              </div>

              {/* INPUT META DATA INFO */}
              <div className={`p-6 rounded-3xl border flex flex-col justify-between ${darkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-stone-200'}`}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-bold uppercase opacity-70 mb-1">Tiêu đề kỷ niệm *</label>
                    <input type="text" required placeholder="Ví dụ: Cả nhà đón giao thừa 2026..." value={newPhoto.title} onChange={(e) => setNewPhoto({ ...newPhoto, title: e.target.value })} className={`w-full px-4 py-2 rounded-xl border text-xs outline-none ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-stone-50 border-stone-200'}`} />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold uppercase opacity-70 mb-1">Chọn Album Phân Loại</label>
                      <select value={newPhoto.albumId} onChange={(e) => setNewPhoto({ ...newPhoto, albumId: e.target.value })} className={`w-full px-3 py-2 rounded-xl border text-xs outline-none ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-stone-50 border-stone-200'}`}>
                        {albums.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                        <option value="">📁 Không phân loại</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase opacity-70 mb-1">Ngày ghi hình</label>
                      <input type="date" value={newPhoto.date} onChange={(e) => setNewPhoto({ ...newPhoto, date: e.target.value })} className={`w-full px-3 py-2 rounded-xl border text-xs outline-none ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-stone-50 border-stone-200'}`} />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase opacity-70 mb-1">Địa điểm chụp</label>
                    <input type="text" placeholder="Ví dụ: Vịnh Hạ Long, Quảng Ninh" value={newPhoto.location} onChange={(e) => setNewPhoto({ ...newPhoto, location: e.target.value })} className={`w-full px-4 py-2 rounded-xl border text-xs outline-none ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-stone-50 border-stone-200'}`} />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase opacity-70 mb-1">Câu chuyện / Cảm xúc</label>
                    <textarea rows="3" placeholder="Viết vài lời nhắn gửi cho tương lai khi xem lại bức ảnh này..." value={newPhoto.description} onChange={(e) => setNewPhoto({ ...newPhoto, description: e.target.value })} className={`w-full px-4 py-2 rounded-xl border text-xs outline-none resize-none ${darkMode ? 'bg-slate-950 border-slate-800 focus:border-amber-500' : 'bg-stone-50 border-stone-200'}`} />
                  </div>
                </div>

                <div className="flex gap-3 mt-4">
                  <button type="button" onClick={() => setActiveTab('gallery')} className="flex-1 py-2 rounded-xl text-xs font-bold border">Hủy</button>
                  <button type="submit" className="flex-1 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 to-rose-500 text-white shadow-md">Lưu Kỷ Niệm</button>
                </div>
              </div>
            </form>
          </div>
        )}

      </main>

      {/* MODAL TẠO ALBUM MỚI */}
      {showNewAlbumModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
          <form onSubmit={handleCreateAlbum} className={`w-full max-w-md p-6 rounded-3xl border shadow-2xl animate-scale-in ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-stone-200'}`}>
            <h3 className="text-xl font-bold mb-4">📁 Khởi Tạo Album Gia Đình Mới</h3>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-[11px] font-bold uppercase opacity-70 mb-1">Tên Album *</label>
                <input type="text" required placeholder="Ví dụ: Kỷ niệm năm 2026..." value={newAlbumData.name} onChange={(e) => setNewAlbumData({ ...newAlbumData, name: e.target.value })} className={`w-full px-4 py-2.5 rounded-xl border text-xs outline-none ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-stone-50 border-stone-200'}`} />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase opacity-70 mb-1">Mô tả album</label>
                <textarea rows="3" placeholder="Album này dùng để chứa những khoảnh khắc gì của cả nhà ta?" value={newAlbumData.description} onChange={(e) => setNewAlbumData({ ...newAlbumData, description: e.target.value })} className={`w-full px-4 py-2.5 rounded-xl border text-xs outline-none resize-none ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-stone-50 border-stone-200'}`} />
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <button type="button" onClick={() => setShowNewAlbumModal(false)} className="px-4 py-2 text-xs font-bold border rounded-xl">Đóng</button>
              <button type="submit" className="px-4 py-2 text-xs font-bold bg-amber-500 text-black rounded-xl">Tạo Album</button>
            </div>
          </form>
        </div>
      )}

      {/* LIGHTBOX MODAL XEM CHI TIẾT ẢNH */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xl animate-fade-in" onClick={() => setSelectedPhoto(null)}>
          <div className={`w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[90vh] md:max-h-[80vh] border animate-scale-in ${darkMode ? 'bg-slate-900 border-slate-800 text-stone-100' : 'bg-white border-stone-100 text-slate-900'}`} onClick={(e) => e.stopPropagation()}>
            <div className="flex-1 bg-black flex items-center justify-center relative min-h-[250px] md:min-h-0">
              <img src={selectedPhoto.src} alt={selectedPhoto.title} className="w-full h-full object-contain max-h-[40vh] md:max-h-[80vh]" />
            </div>

            <div className="w-full md:w-[350px] p-6 flex flex-col justify-between overflow-y-auto">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="inline-block px-2 py-0.5 bg-amber-500/10 text-amber-500 rounded text-xs font-bold mb-1">Năm {selectedPhoto.year}</span>
                    <h3 className="text-xl font-extrabold tracking-tight">{selectedPhoto.title}</h3>
                  </div>
                  <button onClick={() => setSelectedPhoto(null)} className="p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded-full"><Icons.X className="w-5 h-5" /></button>
                </div>

                <div className="space-y-2 mb-4 text-xs opacity-70">
                  <div className="flex items-center gap-2"><Icons.Calendar className="w-4 h-4 text-rose-500" /><span>Ngày ghi hình: <strong>{selectedPhoto.date || 'Chưa rõ'}</strong></span></div>
                  <div className="flex items-center gap-2"><Icons.MapPin className="w-4 h-4 text-amber-500" /><span>Chụp tại: <strong>{selectedPhoto.location || 'Chưa rõ'}</strong></span></div>
                </div>
                <hr className="my-3 border-stone-200 dark:border-slate-800" />
                <p className="text-xs leading-relaxed opacity-90">{selectedPhoto.description || "Không có câu chuyện đằng sau."}</p>
              </div>

              <div className="mt-8 pt-4 border-t dark:border-slate-800 border-stone-200 flex items-center justify-between">
                <button
                  onClick={() => handleToggleLike(selectedPhoto.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${likedPhotos.includes(selectedPhoto.id) ? 'bg-rose-500 border-rose-400 text-white' : ''}`}
                >
                  <Icons.Heart className="w-3.5 h-3.5" filled={likedPhotos.includes(selectedPhoto.id)} /> Thả Tim
                </button>
                
                <button
                  onClick={(e) => { handleDeletePhoto(selectedPhoto.id, e); }}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-stone-400 hover:text-red-500 hover:bg-red-500/10 transition-all"
                >
                  <Icons.Trash className="w-3.5 h-3.5" /> Xóa ảnh
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SLIDESHOW DIỄN HOẠT PHIM KỶ NIỆM */}
      {isSlideshowPlaying && filteredPhotos.length > 0 && (
        <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col justify-between p-6 animate-fade-in">
          <div className="flex justify-between items-center">
            <div className="text-white">
              <p className="text-xs text-amber-400 font-bold uppercase tracking-widest">Trình Chiếu Kỷ Niệm</p>
              <h4 className="text-xs opacity-70">Ảnh {currentSlideIndex + 1} / {filteredPhotos.length}</h4>
            </div>
            <button onClick={() => setIsSlideshowPlaying(false)} className="p-2 bg-white/10 text-white rounded-full"><Icons.X className="w-5 h-5" /></button>
          </div>

          <div className="flex-1 flex items-center justify-center my-4 relative overflow-hidden">
            <div className="max-w-4xl max-h-[60vh] rounded-2xl overflow-hidden shadow-2xl relative animate-scale-in" key={currentSlideIndex}>
              <img src={filteredPhotos[currentSlideIndex].src} alt="Slide" className="max-w-full max-h-[60vh] object-contain" />
            </div>
          </div>

          <div className="max-w-xl mx-auto text-center text-white bg-black/40 p-4 rounded-2xl backdrop-blur-md border border-white/5 w-full">
            <h3 className="text-xl font-bold text-amber-400 mb-1">{filteredPhotos[currentSlideIndex].title}</h3>
            <p className="text-xs text-stone-300 line-clamp-2">"{filteredPhotos[currentSlideIndex].description}"</p>
          </div>

          <div className="max-w-xs mx-auto w-full flex items-center justify-between gap-4">
            <button onClick={() => setCurrentSlideIndex((prev) => (prev - 1 + filteredPhotos.length) % filteredPhotos.length)} className="text-white text-xs">◀ Trước</button>
            <button onClick={() => setIsSlideshowPlaying(!isSlideshowPlaying)} className="p-3 bg-amber-500 text-black rounded-full shadow-lg">
              {isSlideshowPlaying ? <Icons.Pause className="w-4 h-4" /> : <Icons.Play className="w-4 h-4" />}
            </button>
            <button onClick={() => setCurrentSlideIndex((prev) => (prev + 1) % filteredPhotos.length)} className="text-white text-xs">Tiếp ▶</button>
          </div>
        </div>
      )}

      <footer className={`mt-20 border-t py-6 text-center text-xs opacity-50 ${darkMode ? 'border-slate-900' : 'border-stone-200'}`}>
        <p>© Góc Lưu Trữ Album Kỷ Niệm Gia Đình Bất Tử</p>
      </footer>
    </div>
  );
}