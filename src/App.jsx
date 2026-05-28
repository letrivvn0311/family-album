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
  Sparkles
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
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans antialiased bg-gradient-to-br from-indigo-50/40 via-white to-rose-50/40">
      
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
      <header className="sticky top-0 z-30 bg-white/70 backdrop-blur-xl border-b border-slate-100 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setSelectedAlbum(null)}>
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-rose-500 flex items-center justify-center text-white shadow-md shadow-purple-200">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 bg-clip-text text-transparent">
                FamilySpace
              </h1>
              <p className="text-xs text-slate-500 font-medium tracking-wide">KỶ NIỆM GIA ĐÌNH CAO CẤP</p>
            </div>
          </div>

          {!selectedAlbum && (
            <motion.button
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-sm font-semibold rounded-full shadow-lg shadow-indigo-100 transition-all duration-200"
            >
              <FolderPlus className="w-4 h-4" />
              Tạo Album Mới
            </motion.button>
          )}
        </div>
      </header>

      {/* NỘI DUNG CHÍNH */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* TRẠNG THÁI LOADING TOÀN TRANG */}
        {loading && !selectedAlbum && albums.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-40 gap-4">
            <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
            <p className="text-slate-500 font-medium">Đang mở rương kỷ niệm gia đình...</p>
          </div>
        ) : !selectedAlbum ? (
          
          /* ================= DIỆN MẠO TRANG CHỦ ALBUMS ================= */
          <div>
            {/* Thanh Tìm Kiếm & Lọc Cao Cấp */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-10 bg-white p-4 rounded-3xl shadow-sm border border-slate-100">
              <div className="relative w-full md:max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm album theo tên, mô tả, nhãn..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 bg-slate-50 rounded-2xl text-sm border-0 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200 outline-none placeholder:text-slate-400"
                />
              </div>

              {/* Bộ lọc năm phong cách tối giản */}
              <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-none">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-2">Thời gian:</span>
                {years.map((year) => (
                  <button
                    key={year}
                    onClick={() => setSelectedYear(year.toString())}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                      selectedYear === year.toString()
                        ? "bg-slate-900 text-white shadow-md shadow-slate-200"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {year === "All" ? "Tất cả" : `Năm ${year}`}
                  </button>
                ))}
              </div>
            </div>

            {/* DANH SÁCH ALBUMS MASONRY / GRID LAYOUT */}
            {filteredAlbums.length === 0 ? (
              <div className="text-center py-24 bg-white/50 backdrop-blur-sm rounded-3xl border border-dashed border-slate-200">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                  <FolderPlus className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-800">Không tìm thấy album nào</h3>
                <p className="text-slate-500 text-sm mt-1 max-w-xs mx-auto">
                  Hãy thử đổi bộ lọc, từ khóa tìm kiếm hoặc tạo ngay một album gia đình hoàn toàn mới!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredAlbums.map((album) => (
                  <motion.div
                    layout
                    key={album.id}
                    whileHover={{ y: -6, transition: { duration: 0.2 } }}
                    onClick={() => handleSelectAlbum(album)}
                    className="group bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl hover:shadow-indigo-950/5 border border-slate-100 cursor-pointer flex flex-col transition-all duration-300"
                  >
                    {/* Ảnh bìa Album */}
                    <div className="relative aspect-[4/3] w-full bg-slate-100 overflow-hidden">
                      {album.cover_url ? (
                        <img
                          src={album.cover_url}
                          alt={album.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-2 bg-gradient-to-br from-slate-100 to-slate-50">
                          <ImageIcon className="w-8 h-8 stroke-[1.5]" />
                          <span className="text-xs font-medium">Chưa có hình ảnh nào</span>
                        </div>
                      )}
                      
                      {/* Tag Ngày Tháng đè lên góc ảnh */}
                      <div className="absolute top-4 left-4 bg-white/80 backdrop-blur-md px-3 py-1.5 rounded-full text-[11px] font-bold text-slate-800 flex items-center gap-1.5 shadow-sm">
                        <Calendar className="w-3 h-3 text-indigo-600" />
                        {new Date(album.event_date).toLocaleDateString("vi-VN", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </div>
                    </div>

                    {/* Thông tin Album */}
                    <div className="p-6 flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors duration-200 line-clamp-1">
                          {album.title}
                        </h3>
                        <p className="text-sm text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                          {album.description || "Không có mô tả chi tiết cho sự kiện này."}
                        </p>
                      </div>

                      {/* Phân chân Card */}
                      <div className="mt-5 pt-4 border-t border-slate-50 flex items-center justify-between">
                        {/* Tags list */}
                        <div className="flex gap-1 overflow-hidden max-w-[70%]">
                          {album.tags && album.tags.length > 0 ? (
                            album.tags.slice(0, 2).map((tag, i) => (
                              <span key={i} className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md truncate">
                                #{tag}
                              </span>
                            ))
                          ) : (
                            <span className="text-[10px] font-medium text-slate-400">#GiaDinh</span>
                          )}
                        </div>
                        
                        {/* Nút xóa nhanh ẩn khi hover mới hiện rõ */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteAlbum(album.id);
                          }}
                          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-200"
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
            <div className="mb-8">
              <button
                onClick={() => setSelectedAlbum(null)}
                className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-indigo-600 mb-4 transition-colors duration-200 group"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                Quay lại kho album
              </button>

              <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div>
                  <div className="flex flex-wrap items-center gap-3 mb-2">
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                      {selectedAlbum.title}
                    </h2>
                    <span className="text-xs font-bold bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(selectedAlbum.event_date).toLocaleDateString("vi-VN", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                  <p className="text-slate-500 text-sm max-w-2xl leading-relaxed">
                    {selectedAlbum.description || "Không có mô tả cho album này."}
                  </p>
                  
                  {selectedAlbum.tags && selectedAlbum.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-4">
                      {selectedAlbum.tags.map((tag, i) => (
                        <span key={i} className="text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg flex items-center gap-1">
                          <Tag className="w-3 h-3 text-slate-400" />
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Các nút Hành động Upload & Slideshow */}
                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                  {photos.length > 0 && (
                    <button
                      onClick={() => {
                        setLightboxIndex(0);
                        setIsPlayingSlideshow(true);
                      }}
                      className="flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-full text-sm font-bold shadow-md transition-all w-full sm:w-auto"
                    >
                      <Play className="w-4 h-4 fill-current" />
                      Trình chiếu Fullscreen
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
                    className="flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-full text-sm font-bold shadow-lg shadow-indigo-100 transition-all w-full sm:w-auto"
                  >
                    {actionLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <UploadCloud className="w-4 h-4" />
                    )}
                    Thêm Ảnh Vào Album
                  </button>
                </div>
              </div>
            </div>

            {/* GRID ẢNH THÔNG MINH - ĐẢM BẢO ẢNH TO VÀ RÕ NÉT */}
            {loading && photos.length === 0 ? (
              <div className="flex justify-center py-24">
                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
              </div>
            ) : photos.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200 max-w-md mx-auto">
                <div className="w-14 h-14 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4 text-indigo-500">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <h4 className="text-base font-bold text-slate-800">Album này hiện đang trống</h4>
                <p className="text-slate-400 text-xs mt-1 px-6">
                  Click nút "Thêm Ảnh Vào Album" ở trên để lưu trữ những khoảnh khắc tuyệt vời của gia đình nhé.
                </p>
              </div>
            ) : (
              /* Thiết lập Grid tối thiểu 300px giúp ảnh hiển thị kích thước lớn lý tưởng */
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {photos.map((photo, index) => (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.03 }}
                    key={photo.id}
                    onClick={() => setLightboxIndex(index)}
                    className="group relative aspect-[4/3] bg-slate-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 cursor-zoom-in"
                  >
                    <img
                      src={photo.image_url}
                      alt={photo.title || "Family photo"}
                      className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500"
                      loading="lazy"
                    />
                    
                    {/* Overlay thanh công cụ mờ mịn khi hover ảnh */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-4">
                      <div className="flex justify-end">
                        <button
                          onClick={(e) => handleDeletePhoto(photo, index, e)}
                          className="p-2 bg-white/20 backdrop-blur-md hover:bg-red-500 text-white rounded-xl transition-colors duration-200"
                          title="Xóa bức ảnh này"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between text-white">
                        <span className="text-xs font-semibold tracking-wide truncate max-w-[70%]">
                          {photo.title || "Kỷ niệm gia đình"}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            downloadImage(photo.image_url, photo.title);
                          }}
                          className="p-2 bg-white text-slate-900 rounded-xl hover:bg-slate-100 transition-colors"
                          title="Tải ảnh gốc về"
                        >
                          <Download className="w-3.5 h-3.5" />
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
              className="absolute inset-0 bg-slate-950/40 backdrop-blur-md"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white w-full max-w-lg rounded-3xl p-6 sm:p-8 shadow-2xl z-10 border border-slate-100 overflow-hidden"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <FolderPlus className="w-5 h-5 text-indigo-600" />
                  Tạo Album Gia Đình Mới
                </h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateAlbum} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Tên Album / Sự Kiện *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Tết Nguyên Đán 2026, Đi Biển Nha Trang..."
                    value={newAlbum.title}
                    onChange={(e) => setNewAlbum({ ...newAlbum, title: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 rounded-xl border-0 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm font-medium transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Ngày Diễn Ra Sự Kiện *</label>
                  <input
                    type="date"
                    required
                    value={newAlbum.event_date}
                    onChange={(e) => setNewAlbum({ ...newAlbum, event_date: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 rounded-xl border-0 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm font-medium transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Lời Kể / Mô Tả Ngắn</label>
                  <textarea
                    rows={3}
                    placeholder="Ghi lại đôi dòng kỷ niệm đáng nhớ..."
                    value={newAlbum.description}
                    onChange={(e) => setNewAlbum({ ...newAlbum, description: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 rounded-xl border-0 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm font-medium transition-all resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Nhãn (Tags - Phân cách bằng dấu phẩy)</label>
                  <input
                    type="text"
                    placeholder="Tet2026, DuLich, OngBa"
                    value={newAlbum.tags}
                    onChange={(e) => setNewAlbum({ ...newAlbum, tags: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 rounded-xl border-0 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm font-medium transition-all"
                  />
                </div>

                <div className="flex gap-3 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-full text-sm font-bold text-slate-600 transition-all"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:bg-slate-400 text-white rounded-full text-sm font-bold shadow-md transition-all flex items-center gap-2"
                  >
                    {actionLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                    Khởi Tạo Album
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
          <div className="fixed inset-0 z-50 bg-slate-950/98 backdrop-blur-xl flex flex-col justify-between select-none">
            
            {/* Thanh công cụ Lightbox trên cùng */}
            <div className="w-full p-4 flex items-center justify-between text-white z-10 bg-gradient-to-b from-black/50 to-transparent">
              <div className="text-sm font-medium px-2">
                {lightboxIndex + 1} / {photos.length}
              </div>

              {/* Điều khiển trình chiếu & Tải xuống */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsPlayingSlideshow(!isPlayingSlideshow)}
                  className={`p-2.5 rounded-full transition-colors flex items-center gap-1.5 text-xs font-bold ${
                    isPlayingSlideshow ? "bg-amber-500 text-slate-950" : "hover:bg-white/10"
                  }`}
                  title={isPlayingSlideshow ? "Tạm dừng trình chiếu" : "Bắt đầu tự động chiếu"}
                >
                  {isPlayingSlideshow ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                  <span className="hidden sm:inline">{isPlayingSlideshow ? "Đang chiếu" : "Auto Play"}</span>
                </button>

                <button
                  onClick={() => downloadImage(photos[lightboxIndex].image_url, photos[lightboxIndex].title)}
                  className="p-2.5 hover:bg-white/10 rounded-full transition-colors"
                  title="Tải ảnh gốc này"
                >
                  <Download className="w-5 h-5" />
                </button>

                <button
                  onClick={() => {
                    setLightboxIndex(null);
                    setIsPlayingSlideshow(false);
                  }}
                  className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors ml-4"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Vùng xem ảnh trọng tâm (Hiển thị nguyên vẹn, không crop mất chi tiết) */}
            <div className="flex-1 relative flex items-center justify-center p-4">
              
              {/* Nút lùi ảnh */}
              <button
                onClick={() => setLightboxIndex((prev) => (prev - 1 + photos.length) % photos.length)}
                className="absolute left-4 p-3 bg-white/5 hover:bg-white/10 text-white rounded-full backdrop-blur-md transition-all z-10"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>

              {/* Khung ảnh động mượt mà */}
              <AnimatePresence mode="wait">
                <motion.img
                  key={lightboxIndex}
                  src={photos[lightboxIndex].image_url}
                  alt="Ảnh gia đình lớn"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                  className="max-w-full max-h-[75vh] md:max-h-[80vh] object-contain shadow-2xl rounded-sm"
                />
              </AnimatePresence>

              {/* Nút tiến ảnh */}
              <button
                onClick={() => setLightboxIndex((prev) => (prev + 1) % photos.length)}
                className="absolute right-4 p-3 bg-white/5 hover:bg-white/10 text-white rounded-full backdrop-blur-md transition-all z-10"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>

            {/* Thanh thông tin dưới đáy Lightbox */}
            <div className="w-full text-center text-white/80 text-sm p-6 bg-gradient-to-t from-black/60 to-transparent z-10">
              <h4 className="font-semibold text-base text-white">
                {photos[lightboxIndex].title || "Kỷ niệm không tên"}
              </h4>
              <p className="text-xs text-white/50 mt-1">
                Lưu trữ vào ngày: {new Date(photos[lightboxIndex].created_at).toLocaleDateString("vi-VN")}
              </p>
            </div>

          </div>
        )}
      </AnimatePresence>

    </div>
  );
}