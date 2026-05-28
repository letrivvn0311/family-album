import React, { useState, useEffect, useRef } from "react";
import { supabase } from "./supabase";
import { motion, AnimatePresence } from "framer-motion";
import {
  FolderPlus,
  Image as ImageIcon,
  Trash2,
  Download,
  Search,
  Calendar,
  X,
  UploadCloud,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  ArrowLeft,
  Tag,
  Plus,
  Loader2,
  AlertCircle,
  Sparkles,
  Heart,
  Edit,
  Camera,
  Star
} from "lucide-react";

export default function App() {
  // States quản lý Album & UI
  const [albums, setAlbums] = useState([]);
  const [selectedAlbum, setSelectedAlbum] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // States bộ lọc & Tìm kiếm
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedYear, setSelectedYear] = useState("All");

  // States Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [isPlayingSlideshow, setIsPlayingSlideshow] = useState(false);

  // States Form tạo album mới
  const [newAlbum, setNewAlbum] = useState({
    title: "",
    event_date: "",
    description: "",
    tags: "",
  });

  // States Toast thông báo
  const [toast, setToast] = useState(null);

  const fileInputRef = useRef(null);

  // Khởi chạy lấy dữ liệu
  useEffect(() => {
    fetchAlbums();
  }, []);

  // Tự động chuyển ảnh khi bật Slideshow
  useEffect(() => {
    let interval;
    if (isPlayingSlideshow && lightboxIndex !== null) {
      interval = setInterval(() => {
        setLightboxIndex((prev) => (prev + 1) % photos.length);
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [isPlayingSlideshow, lightboxIndex, photos.length]);

  // Hiển thị thông báo nhanh (Toast)
  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // --- API CHỨC NĂNG SUPABASE ---

  // Lấy danh sách Albums
  const fetchAlbums = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .order("event_date", { ascending: false });

      if (error) throw error;
      setAlbums(data || []);
    } catch (error) {
      showToast("Không thể tải danh sách album: " + error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  // Xem chi tiết một Album (Lấy ảnh bên trong)
  const handleSelectAlbum = async (album) => {
    setSelectedAlbum(album);
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("photos")
        .select("*")
        .eq("event_id", album.id)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setPhotos(data || []);
    } catch (error) {
      showToast("Không thể tải ảnh trong album: " + error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  // Tạo Album mới
  const handleCreateAlbum = async (e) => {
    e.preventDefault();
    if (!newAlbum.title || !newAlbum.event_date) {
      showToast("Vui lòng điền tên album và ngày sự kiện!", "error");
      return;
    }

    try {
      setActionLoading(true);
      const { data, error } = await supabase
        .from("events")
        .insert([
          {
            title: newAlbum.title,
            event_date: newAlbum.event_date,
            description: newAlbum.description,
            tags: newAlbum.tags ? newAlbum.tags.split(",").map(t => t.trim()) : [],
          },
        ])
        .select();

      if (error) throw error;

      showToast("Tạo album gia đình thành công! ✨");
      setShowCreateModal(false);
      setNewAlbum({ title: "", event_date: "", description: "", tags: "" });
      fetchAlbums();
    } catch (error) {
      showToast("Lỗi khi tạo album: " + error.message, "error");
    } finally {
      setActionLoading(false);
    }
  };

  // Upload nhiều ảnh cùng lúc
  const handleUploadPhotos = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setActionLoading(true);
      let isFirstPhoto = photos.length === 0;
      let firstPhotoUrl = "";

      for (let file of files) {
        const fileExt = file.name.split(".").pop();
        const fileName = `${selectedAlbum.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const storagePath = fileName;

        // 1. Upload lên Storage Bucket 'family-photos'
        const { error: uploadError } = await supabase.storage
          .from("family-photos")
          .upload(storagePath, file);

        if (uploadError) throw uploadError;

        // 2. Lấy Public URL của ảnh vừa upload
        const { data: { publicUrl } } = supabase.storage
          .from("family-photos")
          .getPublicUrl(storagePath);

        if (isFirstPhoto && !firstPhotoUrl) {
          firstPhotoUrl = publicUrl;
        }

        // 3. Chèn thông tin vào bảng 'photos'
        const { error: insertError } = await supabase
          .from("photos")
          .insert([
            {
              event_id: selectedAlbum.id,
              title: file.name.split(".")[0],
              image_url: publicUrl,
              storage_path: storagePath,
            },
          ]);

        if (insertError) throw insertError;
      }

      // 4. Nếu Album chưa có cover, cập nhật ảnh đầu tiên làm Cover
      if (isFirstPhoto && firstPhotoUrl && !selectedAlbum.cover_url) {
        await supabase
          .from("events")
          .update({ cover_url: firstPhotoUrl })
          .eq("id", selectedAlbum.id);
        
        setSelectedAlbum(prev => ({ ...prev, cover_url: firstPhotoUrl }));
        fetchAlbums();
      }

      showToast(`Đã tải lên thành công ${files.length} ảnh! 📸`);
      handleSelectAlbum(selectedAlbum); // Tải lại danh sách ảnh
    } catch (error) {
      showToast("Lỗi trong quá trình upload: " + error.message, "error");
    } finally {
      setActionLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Xóa 1 bức ảnh cụ thể
  const handleDeletePhoto = async (photo, index, e) => {
    e.stopPropagation(); // Ngăn kích hoạt click mở lightbox
    if (!confirm("Bạn có chắc chắn muốn xóa bức ảnh kỷ niệm này không?")) return;

    try {
      setActionLoading(true);

      // 1. Xóa file khỏi Storage
      if (photo.storage_path) {
        await supabase.storage.from("family-photos").remove([photo.storage_path]);
      }

      // 2. Xóa dòng dữ liệu trong DB
      const { error } = await supabase.from("photos").delete().eq("id", photo.id);
      if (error) throw error;

      showToast("Đã xóa ảnh thành công.");
      
      // Cập nhật lại UI cục bộ để tăng tốc độ phản hồi
      const updatedPhotos = photos.filter((p) => p.id !== photo.id);
      setPhotos(updatedPhotos);

      // Nếu xóa đúng ảnh đang làm cover, cập nhật lại cover mới cho album
      if (selectedAlbum.cover_url === photo.image_url) {
        const nextCover = updatedPhotos.length > 0 ? updatedPhotos[0].image_url : null;
        await supabase.from("events").update({ cover_url: nextCover }).eq("id", selectedAlbum.id);
        setSelectedAlbum(prev => ({ ...prev, cover_url: nextCover }));
        fetchAlbums();
      }
    } catch (error) {
      showToast("Lỗi khi xóa ảnh: " + error.message, "error");
    } finally {
      setActionLoading(false);
    }
  };

  // Xóa toàn bộ Album (Xóa sạch Storage -> Xóa Photos DB -> Xóa Event DB)
  const handleDeleteAlbum = async (albumId) => {
    if (!confirm("CẢNH BÁO: Hành động này sẽ xóa toàn bộ ảnh bên trong album này vĩnh viễn. Bạn chắc chắn chứ?")) return;

    try {
      setActionLoading(true);

      // 1. Lấy tất cả ảnh thuộc album để lấy storage_path
      const { data: albumPhotos } = await supabase
        .from("photos")
        .select("storage_path")
        .eq("event_id", albumId);

      if (albumPhotos && albumPhotos.length > 0) {
        const pathsToDelete = albumPhotos.map(p => p.storage_path).filter(Boolean);
        if (pathsToDelete.length > 0) {
          // Xóa tất cả file trong Storage
          await supabase.storage.from("family-photos").remove(pathsToDelete);
        }
      }

      // 2. Xóa photos trong DB (Cascade tự động nếu cài đặt DB, hoặc xóa thủ công bằng lệnh dưới)
      await supabase.from("photos").delete().eq("event_id", albumId);

      // 3. Xóa sự kiện gốc
      const { error } = await supabase.from("events").delete().eq("id", albumId);
      if (error) throw error;

      showToast("Đã xóa hoàn toàn album gia đình.");
      setSelectedAlbum(null);
      fetchAlbums();
    } catch (error) {
      showToast("Gặp lỗi khi xóa dữ liệu: " + error.message, "error");
    } finally {
      setActionLoading(false);
    }
  };

  // Tải ảnh về máy trực tiếp
  const downloadImage = async (imageUrl, title) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${title || "family-photo"}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      showToast("Không thể tải ảnh xuống trực tiếp, vui lòng mở tab mới để lưu.", "error");
    }
  };

  // --- XỬ LÝ LỌC & TÌM KIẾM ---
  const years = ["All", ...new Set(albums.map(a => new Date(a.event_date).getFullYear()))].sort((a,b) => b-a);

  const filteredAlbums = albums.filter((album) => {
    const matchesSearch = 
      album.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (album.description && album.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (album.tags && album.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())));
    
    const albumYear = new Date(album.event_date).getFullYear().toString();
    const matchesYear = selectedYear === "All" || albumYear === selectedYear;

    return matchesSearch && matchesYear;
  });

  return (
    <div className="min-h-screen bg-[#FFFDF9] text-slate-800 font-sans antialiased bg-gradient-to-br from-amber-50 via-white to-pink-50 relative overflow-hidden">
      
      {/* HỌA TIẾT NỀN LUNG LINH */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <Star key={i} className={`absolute text-amber-300 fill-amber-200 ${['animate-pulse', 'animate-slow-fade'][i%2]}`} style={{
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            width: `${Math.random() * 15 + 5}px`,
            height: `${Math.random() * 15 + 5}px`,
            animationDelay: `${Math.random() * 5}s`,
            animationDuration: `${Math.random() * 5 + 3}s`
          }} />
        ))}
      </div>

      {/* GLOBAL TOAST NOTIFICATION */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-6 py-3.5 rounded-full shadow-2xl backdrop-blur-md text-sm font-medium ${
              toast.type === "error" ? "bg-red-500/90 text-white" : "bg-slate-900/90 text-white"
            }`}
          >
            {toast.type === "error" ? <AlertCircle className="w-4 h-4" /> : <Sparkles className="w-4 h-4 text-amber-400" />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* HEADER KHÔNG GIAN SỐNG ĐỘNG */}
      <header className="sticky top-0 z-30 bg-white/70 backdrop-blur-xl border-b border-amber-100 transition-all duration-300 shadow-sm shadow-amber-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setSelectedAlbum(null)}>
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-400 via-pink-400 to-rose-400 flex items-center justify-center text-white shadow-md shadow-pink-100 relative group overflow-hidden">
               <motion.div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity" whileHover={{ scale: 1.5, rotate: 30 }} />
              <Heart className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold bg-gradient-to-r from-amber-600 via-pink-600 to-rose-600 bg-clip-text text-transparent tracking-tighter">
                Góc Gia Đình ❤️
              </h1>
              <p className="text-xs text-amber-700 font-medium tracking-wide">NƠI LƯU GIỮ YÊU THƯƠNG</p>
            </div>
          </div>

          {!selectedAlbum && (
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white text-sm font-semibold rounded-full shadow-lg shadow-pink-100 transition-all duration-200"
            >
              <FolderPlus className="w-4 h-4" />
              Thêm Album Mới
            </motion.button>
          )}
        </div>
      </header>

      {/* NỘI DUNG CHÍNH */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative z-10">
        
        {/* TRẠNG THÁI LOADING TOÀN TRANG */}
        {loading && !selectedAlbum && albums.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-40 gap-4">
            <Loader2 className="w-10 h-10 text-pink-600 animate-spin" />
            <p className="text-amber-700 font-medium">Đang mở rương kỷ niệm...</p>
          </div>
        ) : !selectedAlbum ? (
          
          /* ================= DIỆN MẠO TRANG CHỦ ALBUMS ================= */
          <div>
            {/* Thanh Tìm Kiếm & Lọc Cao Cấp */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-12 bg-white p-5 rounded-3xl shadow-lg shadow-amber-50 border border-amber-50 relative overflow-hidden group">
               <div className="absolute -top-10 -right-10 w-24 h-24 bg-gradient-to-br from-pink-100 to-amber-100 rounded-full opacity-50 group-hover:scale-110 transition-transform" />
              <div className="relative w-full md:max-w-md z-10">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-400" />
                <input
                  type="text"
                  placeholder="Tìm album theo tên, mô tả, nhãn..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-amber-50 rounded-2xl text-sm border-0 focus:bg-white focus:ring-2 focus:ring-pink-500/20 transition-all duration-200 outline-none placeholder:text-amber-400"
                />
              </div>

              {/* Bộ lọc năm phong cách tối giản */}
              <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-none z-10">
                <span className="text-xs font-semibold text-amber-600 uppercase tracking-wider px-2">Thời gian:</span>
                {years.map((year) => (
                  <button
                    key={year}
                    onClick={() => setSelectedYear(year.toString())}
                    className={`px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                      selectedYear === year.toString()
                        ? "bg-pink-500 text-white shadow-md shadow-pink-200"
                        : "bg-amber-100 text-amber-800 hover:bg-amber-200"
                    }`}
                  >
                    {year === "All" ? "Tất cả" : `Năm ${year}`}
                  </button>
                ))}
              </div>
            </div>

            {/* DANH SÁCH ALBUMS MASONRY / GRID LAYOUT */}
            {filteredAlbums.length === 0 ? (
              <div className="text-center py-28 bg-white rounded-3xl border border-dashed border-amber-200 shadow-sm relative overflow-hidden group">
                  <Heart className="absolute top-10 right-10 text-pink-100 w-16 h-16 opacity-30 animate-slow-fade"/>
                   <Sparkles className="absolute bottom-10 left-10 text-amber-100 w-12 h-12 opacity-30 animate-pulse"/>
                <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-5 text-amber-500 relative z-10">
                  <ImageIcon className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 relative z-10">Kỷ niệm đang chờ được viết tiếp...</h3>
                <p className="text-amber-700 text-sm mt-1 max-w-xs mx-auto relative z-10">
                  Hãy thử đổi bộ lọc hoặc tạo ngay một album để lưu giữ những khoảnh khắc tuyệt vời!
                </p>
                 <motion.button
                  whileHover={{ scale: 1.05 }}
                  onClick={() => setShowCreateModal(true)}
                  className="mt-6 flex items-center gap-2 px-5 py-2.5 bg-pink-500 text-white text-sm font-semibold rounded-full mx-auto relative z-10 shadow-md"
                >
                  <Plus className="w-4 h-4" />
                  Tạo Album
                </motion.button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredAlbums.map((album) => (
                  <motion.div
                    layout
                    key={album.id}
                    whileHover={{ y: -8, transition: { duration: 0.3 } }}
                    onClick={() => handleSelectAlbum(album)}
                    className="group bg-white rounded-3xl overflow-hidden shadow-xl hover:shadow-pink-950/10 border border-amber-50 cursor-pointer flex flex-col transition-all duration-300 relative"
                  >
                     {/* Phụ kiện trang trí card */}
                    <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-pink-50 to-transparent rounded-bl-full opacity-50 group-hover:opacity-100 transition-opacity" />
                     <Star className="absolute top-4 right-4 text-amber-300 w-4 h-4 fill-amber-200 opacity-0 group-hover:opacity-100 transition-opacity delay-100"/>
                    
                    {/* Ảnh bìa Album */}
                    <div className="relative aspect-[4/3] w-full bg-amber-50 overflow-hidden">
                      {album.cover_url ? (
                        <img
                          src={album.cover_url}
                          alt={album.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 ease-out"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-amber-400 gap-2 bg-gradient-to-br from-amber-100 to-amber-50">
                          <ImageIcon className="w-8 h-8 stroke-[1.5]" />
                          <span className="text-xs font-medium">Chưa có ảnh nào</span>
                        </div>
                      )}
                      
                      {/* Tag Ngày Tháng đè lên góc ảnh */}
                      <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3.5 py-1.5 rounded-full text-[11px] font-bold text-amber-900 flex items-center gap-1.5 shadow-sm border border-amber-50">
                        <Calendar className="w-3.5 h-3.5 text-pink-600 fill-pink-100" />
                        {new Date(album.event_date).toLocaleDateString("vi-VN", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </div>
                    </div>

                    {/* Thông tin Album */}
                    <div className="p-7 flex-1 flex flex-col justify-between relative z-10">
                      <div>
                        <h3 className="text-xl font-extrabold text-slate-900 group-hover:text-pink-600 transition-colors duration-300 line-clamp-1 tracking-tight">
                          {album.title}
                        </h3>
                        <p className="text-sm text-amber-800 mt-2 line-clamp-2 leading-relaxed">
                          {album.description || "Một khoảnh khắc ý nghĩa của gia đình."}
                        </p>
                      </div>

                      {/* Phân chân Card */}
                      <div className="mt-6 pt-5 border-t border-amber-100 flex items-center justify-between">
                        {/* Tags list */}
                        <div className="flex gap-1.5 overflow-hidden max-w-[70%]">
                          {album.tags && album.tags.length > 0 ? (
                            album.tags.slice(0, 2).map((tag, i) => (
                              <span key={i} className="text-[10px] font-bold bg-pink-50 text-pink-800 px-2.5 py-1 rounded-full truncate">
                                #{tag}
                              </span>
                            ))
                          ) : (
                            <span className="text-[10px] font-bold text-amber-500 bg-amber-50 px-2.5 py-1 rounded-full">#GiaDinhYeuThuong</span>
                          )}
                        </div>
                        
                        {/* Nút xóa nhanh ẩn khi hover mới hiện rõ */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteAlbum(album.id);
                          }}
                          className="p-2 text-amber-400 hover:text-red-600 hover:bg-red-50 rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300"
                          title="Xóa Album"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        ) : (
          
          /* ================= DIỆN MẠO XEM CHI TIẾT ALBUM ================= */
          <div>
            {/* Thanh điều hướng quay về & Tiêu đề Album lớn */}
            <div className="mb-10">
              <button
                onClick={() => setSelectedAlbum(null)}
                className="flex items-center gap-2.5 text-sm font-semibold text-amber-800 hover:text-pink-600 mb-5 transition-colors duration-200 group"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1.5 transition-transform" />
                Về Trang Chủ Kỷ Niệm
              </button>

              <div className="bg-white p-7 sm:p-9 rounded-3xl shadow-xl shadow-amber-50 border border-amber-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-7 relative overflow-hidden group">
                   {/* Phụ kiện trang trí header */}
                    <Heart className="absolute -top-5 -right-5 text-pink-100 w-20 h-20 opacity-30 animate-pulse"/>
                    <Sparkles className="absolute -bottom-3 left-1/4 text-amber-200 w-8 h-8 opacity-40 animate-slow-fade"/>

                <div className="relative z-10">
                  <div className="flex flex-wrap items-center gap-3.5 mb-3">
                    <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tighter">
                      {selectedAlbum.title}
                    </h2>
                    <span className="text-xs font-bold bg-pink-100 text-pink-800 px-3.5 py-1.5 rounded-full flex items-center gap-1.5 shadow-inner">
                      <Calendar className="w-4 h-4" />
                      {new Date(selectedAlbum.event_date).toLocaleDateString("vi-VN", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                  <p className="text-amber-800 text-base max-w-2xl leading-relaxed">
                    {selectedAlbum.description || "Không có mô tả cho album này."}
                  </p>
                  
                  {selectedAlbum.tags && selectedAlbum.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-5">
                      {selectedAlbum.tags.map((tag, i) => (
                        <span key={i} className="text-xs font-bold text-amber-900 bg-amber-100 px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
                          <Tag className="w-3.5 h-3.5 text-amber-500" />
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Các nút Hành động Upload & Slideshow */}
                <div className="flex flex-wrap items-center gap-3.5 w-full md:w-auto relative z-10">
                  {photos.length > 0 && (
                    <button
                      onClick={() => {
                        setLightboxIndex(0);
                        setIsPlayingSlideshow(true);
                      }}
                      className="flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-full text-sm font-bold shadow-lg transition-all w-full sm:w-auto"
                    >
                      <Play className="w-4 h-4 fill-current" />
                      Xem Trình Chiếu ✨
                    </button>
                  )}
                  
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={handleUploadPhotos}
                    className="hidden"
                  />
                  <button
                    disabled={actionLoading}
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 disabled:bg-pink-300 text-white rounded-full text-sm font-bold shadow-lg shadow-pink-100 transition-all w-full sm:w-auto group"
                  >
                    {actionLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Camera className="w-4 h-4 group-hover:scale-110 transition-transform"/>
                    )}
                    Thêm Ảnh Yêu Thương
                  </button>
                </div>
              </div>
            </div>

            {/* GRID ẢNH THÔNG MINH - ĐẢM BẢO ẢNH TO VÀ RÕ NÉT */}
            {loading && photos.length === 0 ? (
              <div className="flex justify-center py-28">
                <Loader2 className="w-10 h-10 text-pink-600 animate-spin" />
              </div>
            ) : photos.length === 0 ? (
              <div className="text-center py-24 bg-white rounded-3xl border border-dashed border-amber-200 max-w-md mx-auto shadow-inner relative overflow-hidden group">
                  <Sparkles className="absolute -top-3 -left-3 text-amber-200 w-10 h-10 opacity-30 animate-pulse"/>
                <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-5 text-pink-500 relative z-10 shadow-sm border border-pink-50">
                  <UploadCloud className="w-7 h-7" />
                </div>
                <h4 className="text-base font-bold text-slate-800 relative z-10">Mảnh ký niệm đang trống trải...</h4>
                <p className="text-amber-700 text-xs mt-1 px-8 relative z-10">
                  Click nút "Thêm Ảnh Yêu Thương" để lấp đầy album bằng những khoảnh khắc tuyệt vời nhé!
                </p>
              </div>
            ) : (
              /* Thiết lập Grid tối thiểu 300px giúp ảnh hiển thị kích thước lớn lý tưởng */
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-7">
                {photos.map((photo, index) => (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.04, duration: 0.4 }}
                    key={photo.id}
                    onClick={() => setLightboxIndex(index)}
                    className="group relative aspect-[4/3] bg-amber-50 rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl hover:shadow-pink-950/10 transition-all duration-300 cursor-zoom-in"
                  >
                    <img
                      src={photo.image_url}
                      alt={photo.title || "Family photo"}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      loading="lazy"
                    />
                    
                    {/* Overlay thanh công cụ mờ mịn khi hover ảnh */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-4 z-10">
                      <div className="flex justify-end">
                        <button
                          onClick={(e) => handleDeletePhoto(photo, index, e)}
                          className="p-2.5 bg-white/20 backdrop-blur-md hover:bg-red-600 text-white rounded-xl transition-colors duration-200 group"
                          title="Xóa bức ảnh này"
                        >
                          <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between text-white">
                        <span className="text-sm font-bold tracking-tight truncate max-w-[75%]">
                          {photo.title || "Kỷ niệm gia đình"}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            downloadImage(photo.image_url, photo.title);
                          }}
                          className="p-2.5 bg-white text-pink-600 rounded-xl hover:bg-pink-50 transition-colors group"
                          title="Tải ảnh gốc về"
                        >
                          <Download className="w-4 h-4 group-hover:scale-110 transition-transform" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* ================= MODAL: TẠO ALBUM MỚI (GLASSMORPHISM) ================= */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCreateModal(false)}
              className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              className="relative bg-white w-full max-w-lg rounded-3xl p-7 sm:p-9 shadow-2xl z-10 border border-amber-50 overflow-hidden"
            >
                 {/* Phụ kiện trang trí modal */}
                  <Heart className="absolute -top-6 -right-6 text-pink-100 w-24 h-24 opacity-30"/>
                  <Sparkles className="absolute -bottom-4 left-1/3 text-amber-200 w-10 h-10 opacity-30"/>

              <div className="flex items-center justify-between mb-7 relative z-10">
                <h3 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2.5 tracking-tighter">
                  <div className="p-2.5 bg-pink-100 rounded-xl text-pink-600 shadow-inner border border-pink-50">
                    <FolderPlus className="w-5 h-5"/>
                  </div>
                  Thêm Góc Kỷ Niệm Mới
                </h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-2 hover:bg-amber-100 rounded-xl text-amber-400 hover:text-amber-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateAlbum} className="space-y-6 relative z-10">
                <div>
                  <label className="block text-xs font-bold text-amber-700 uppercase tracking-wider mb-2.5">Tên Album / Sự Kiện *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Tết Nguyên Đán 2026, Sinh Nhật Bé Bơ..."
                    value={newAlbum.title}
                    onChange={(e) => setNewAlbum({ ...newAlbum, title: e.target.value })}
                    className="w-full px-5 py-3.5 bg-amber-50 rounded-xl border border-amber-100 focus:bg-white focus:ring-2 focus:ring-pink-500/20 outline-none text-sm font-medium transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-amber-700 uppercase tracking-wider mb-2.5">Ngày Diễn Ra *</label>
                  <input
                    type="date"
                    required
                    value={newAlbum.event_date}
                    onChange={(e) => setNewAlbum({ ...newAlbum, event_date: e.target.value })}
                    className="w-full px-5 py-3.5 bg-amber-50 rounded-xl border border-amber-100 focus:bg-white focus:ring-2 focus:ring-pink-500/20 outline-none text-sm font-medium transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-amber-700 uppercase tracking-wider mb-2.5">Lời Nhắn / Mô Tả Ngắn</label>
                  <textarea
                    rows={3}
                    placeholder="Ghi lại đôi dòng kỷ niệm đáng nhớ cho album này..."
                    value={newAlbum.description}
                    onChange={(e) => setNewAlbum({ ...newAlbum, description: e.target.value })}
                    className="w-full px-5 py-3.5 bg-amber-50 rounded-xl border border-amber-100 focus:bg-white focus:ring-2 focus:ring-pink-500/20 outline-none text-sm font-medium transition-all resize-none leading-relaxed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-amber-700 uppercase tracking-wider mb-2.5">Nhãn (Tags - Phân cách bằng dấu phẩy)</label>
                  <input
                    type="text"
                    placeholder="Tet2026, DuLich, GiaDinh, ConYeu"
                    value={newAlbum.tags}
                    onChange={(e) => setNewAlbum({ ...newAlbum, tags: e.target.value })}
                    className="w-full px-5 py-3.5 bg-amber-50 rounded-xl border border-amber-100 focus:bg-white focus:ring-2 focus:ring-pink-500/20 outline-none text-sm font-medium transition-all"
                  />
                </div>

                <div className="flex gap-3.5 justify-end pt-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-6 py-3 bg-amber-100 hover:bg-amber-200 rounded-full text-sm font-bold text-amber-800 transition-all shadow-inner"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-7 py-3 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 disabled:bg-slate-400 text-white rounded-full text-sm font-bold shadow-lg transition-all flex items-center gap-2 group"
                  >
                    {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4 group-hover:scale-110"/>}
                    Tạo Album Ngay
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ================= LIGHTBOX XEM ẢNH GẦN TOÀN MÀN HÌNH & TRÌNH CHIẾU ================= */}
      <AnimatePresence>
        {lightboxIndex !== null && photos[lightboxIndex] && (
          <div className="fixed inset-0 z-50 bg-slate-950/99 backdrop-blur-xl flex flex-col justify-between select-none">
            
            {/* Thanh công cụ Lightbox trên cùng */}
            <div className="w-full p-5 flex items-center justify-between text-white z-10 bg-gradient-to-b from-black/60 to-transparent">
              <div className="text-sm font-bold px-3 py-1.5 bg-white/10 rounded-full backdrop-blur-sm border border-white/5 shadow-inner">
                {lightboxIndex + 1} / {photos.length}
              </div>

              {/* Điều khiển trình chiếu & Tải xuống */}
              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => setIsPlayingSlideshow(!isPlayingSlideshow)}
                  className={`p-3 rounded-full transition-colors flex items-center gap-2 text-xs font-bold border ${
                    isPlayingSlideshow ? "bg-amber-400 text-slate-950 border-amber-300 shadow-md" : "hover:bg-white/10 border-white/10 bg-white/5 backdrop-blur-sm"
                  }`}
                  title={isPlayingSlideshow ? "Tạm dừng trình chiếu" : "Bắt đầu tự động chiếu"}
                >
                  {isPlayingSlideshow ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                  <span className="hidden sm:inline">{isPlayingSlideshow ? "Đang chiếu ✨" : "Tự Động Chiếu"}</span>
                </button>

                <button
                  onClick={() => downloadImage(photos[lightboxIndex].image_url, photos[lightboxIndex].title)}
                  className="p-3 hover:bg-white/10 rounded-full transition-colors bg-white/5 border border-white/10 backdrop-blur-sm"
                  title="Tải ảnh gốc này"
                >
                  <Download className="w-5 h-5" />
                </button>

                <button
                  onClick={() => {
                    setLightboxIndex(null);
                    setIsPlayingSlideshow(false);
                  }}
                  className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors ml-5 border border-white/10 backdrop-blur-sm"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Vùng xem ảnh trọng tâm (Hiển thị nguyên vẹn, không crop mất chi tiết) */}
            <div className="flex-1 relative flex items-center justify-center p-5 group">
              
              {/* Nút lùi ảnh */}
              <button
                onClick={() => setLightboxIndex((prev) => (prev - 1 + photos.length) % photos.length)}
                className="absolute left-6 p-4 bg-white/5 hover:bg-white/10 text-white rounded-full backdrop-blur-md transition-all z-10 border border-white/10 shadow-lg opacity-0 group-hover:opacity-100 translate-x-3 group-hover:translate-x-0"
              >
                <ChevronLeft className="w-7 h-7" />
              </button>

              {/* Khung ảnh động mượt mà */}
              <AnimatePresence mode="wait">
                <motion.img
                  key={lightboxIndex}
                  src={photos[lightboxIndex].image_url}
                  alt="Ảnh gia đình lớn"
                  initial={{ opacity: 0, scale: 0.92, filter: 'blur(10px)' }}
                  animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, scale: 0.92, filter: 'blur(10px)' }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                  className="max-w-full max-h-[75vh] md:max-h-[82vh] object-contain shadow-2xl shadow-pink-950/20 rounded-md relative z-0"
                />
              </AnimatePresence>

              {/* Nút tiến ảnh */}
              <button
                onClick={() => setLightboxIndex((prev) => (prev + 1) % photos.length)}
                className="absolute right-6 p-4 bg-white/5 hover:bg-white/10 text-white rounded-full backdrop-blur-md transition-all z-10 border border-white/10 shadow-lg opacity-0 group-hover:opacity-100 -translate-x-3 group-hover:translate-x-0"
              >
                <ChevronRight className="w-7 h-7" />
              </button>
            </div>

            {/* Thanh thông tin dưới đáy Lightbox */}
            <div className="w-full text-center text-white/80 text-sm p-7 bg-gradient-to-t from-black/70 to-transparent z-10">
              <h4 className="font-extrabold text-lg text-white tracking-tight">
                {photos[lightboxIndex].title || "Khoảnh khắc không tên"}
              </h4>
              <p className="text-xs text-white/60 mt-1.5 font-medium">
                Ghi nhớ vào ngày: {new Date(photos[lightboxIndex].created_at).toLocaleDateString("vi-VN", { year: 'numeric', month: 'long', day: 'numeric'})}
              </p>
            </div>

          </div>
        )}
      </AnimatePresence>

    </div>
  );
}