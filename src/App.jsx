import React, { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "./supabase";
import { motion, AnimatePresence } from "framer-motion";
import {
  ImagePlus,
  Plus,
  Search,
  Calendar,
  Tag,
  Trash2,
  UploadCloud,
  X,
  ChevronLeft,
  ChevronRight,
  Download,
  Play,
  Pause,
  Images,
  Sparkles,
  Loader2,
  AlertTriangle,
  FolderHeart,
  ArrowLeft,
  Maximize2,
  Archive,
} from "lucide-react";

const BUCKET = "family-photos";

export default function App() {
  const [events, setEvents] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const [loading, setLoading] = useState(true);
  const [albumLoading, setAlbumLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [search, setSearch] = useState("");
  const [monthFilter, setMonthFilter] = useState("");
  const [yearFilter, setYearFilter] = useState("");

  const [showCreate, setShowCreate] = useState(false);
  const [toast, setToast] = useState(null);

  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [slideshow, setSlideshow] = useState(false);

  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    title: "",
    event_date: "",
    description: "",
    tags: "",
    icon_name: "FolderHeart",
  });

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    if (!slideshow || lightboxIndex === null || photos.length <= 1) return;

    const timer = setInterval(() => {
      setLightboxIndex((prev) => (prev + 1) % photos.length);
    }, 3200);

    return () => clearInterval(timer);
  }, [slideshow, lightboxIndex, photos.length]);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchEvents = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("events")
        .select("*, photos(id)")
        .order("event_date", { ascending: false });

      if (error) throw error;

      setEvents(data || []);
    } catch (error) {
      showToast(error.message || "Không thể tải danh sách album", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchPhotos = async (eventId) => {
    try {
      setAlbumLoading(true);

      const { data, error } = await supabase
        .from("photos")
        .select("*")
        .eq("event_id", eventId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setPhotos(data || []);
    } catch (error) {
      showToast(error.message || "Không thể tải ảnh", "error");
    } finally {
      setAlbumLoading(false);
    }
  };

  const openAlbum = async (event) => {
    setSelectedEvent(event);
    setPhotos([]);
    await fetchPhotos(event.id);
  };

  const createAlbum = async (e) => {
    e.preventDefault();

    if (!form.title.trim()) {
      showToast("Vui lòng nhập tên album", "error");
      return;
    }

    try {
      const payload = {
        title: form.title.trim(),
        event_date: form.event_date || null,
        description: form.description.trim(),
        tags: normalizeTags(form.tags),
        cover_url: null,
        icon_name: form.icon_name || "FolderHeart",
      };

      const { data, error } = await supabase
        .from("events")
        .insert(payload)
        .select()
        .single();

      if (error) throw error;

      setEvents((prev) => [data, ...prev]);
      setShowCreate(false);
      setForm({
        title: "",
        event_date: "",
        description: "",
        tags: "",
        icon_name: "FolderHeart",
      });

      showToast("Đã tạo album mới");
    } catch (error) {
      showToast(error.message || "Không thể tạo album", "error");
    }
  };

  const uploadPhotos = async (files) => {
    if (!selectedEvent || !files?.length) return;

    try {
      setUploading(true);

      const uploadedRows = [];

      for (const file of files) {
        if (!file.type.startsWith("image/")) continue;

        const safeName = file.name
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-zA-Z0-9._-]/g, "-");

        const path = `${selectedEvent.id}/${Date.now()}-${crypto.randomUUID()}-${safeName}`;

        const { error: uploadError } = await supabase.storage
          .from(BUCKET)
          .upload(path, file, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) throw uploadError;

        const { data: publicData } = supabase.storage
          .from(BUCKET)
          .getPublicUrl(path);

        const publicUrl = publicData?.publicUrl;

        const { data: photoRow, error: insertError } = await supabase
          .from("photos")
          .insert({
            event_id: selectedEvent.id,
            title: file.name,
            image_url: publicUrl,
            storage_path: path,
          })
          .select()
          .single();

        if (insertError) throw insertError;

        uploadedRows.push(photoRow);

        if (!selectedEvent.cover_url && uploadedRows.length === 1) {
          const { error: coverError } = await supabase
            .from("events")
            .update({ cover_url: publicUrl })
            .eq("id", selectedEvent.id);

          if (coverError) throw coverError;

          setSelectedEvent((prev) => ({
            ...prev,
            cover_url: publicUrl,
          }));

          setEvents((prev) =>
            prev.map((ev) =>
              ev.id === selectedEvent.id ? { ...ev, cover_url: publicUrl } : ev
            )
          );
        }
      }

      setPhotos((prev) => [...uploadedRows, ...prev]);
      await fetchEvents();

      showToast(`Đã upload ${uploadedRows.length} ảnh`);
    } catch (error) {
      showToast(error.message || "Upload ảnh thất bại", "error");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const deletePhoto = async (photo) => {
    const ok = window.confirm("Bạn có chắc muốn xóa ảnh này không?");
    if (!ok) return;

    try {
      if (photo.storage_path) {
        const { error: storageError } = await supabase.storage
          .from(BUCKET)
          .remove([photo.storage_path]);

        if (storageError) throw storageError;
      }

      const { error } = await supabase.from("photos").delete().eq("id", photo.id);
      if (error) throw error;

      const nextPhotos = photos.filter((p) => p.id !== photo.id);
      setPhotos(nextPhotos);

      if (selectedEvent.cover_url === photo.image_url) {
        const newCover = nextPhotos[0]?.image_url || null;

        const { error: coverError } = await supabase
          .from("events")
          .update({ cover_url: newCover })
          .eq("id", selectedEvent.id);

        if (coverError) throw coverError;

        setSelectedEvent((prev) => ({ ...prev, cover_url: newCover }));
        setEvents((prev) =>
          prev.map((ev) =>
            ev.id === selectedEvent.id ? { ...ev, cover_url: newCover } : ev
          )
        );
      }

      setLightboxIndex(null);
      setSlideshow(false);
      showToast("Đã xóa ảnh");
    } catch (error) {
      showToast(error.message || "Không thể xóa ảnh", "error");
    }
  };

  const deleteAlbum = async (event) => {
    const ok = window.confirm(
      `Bạn có chắc muốn xóa album "${event.title}" và toàn bộ ảnh bên trong không?`
    );

    if (!ok) return;

    try {
      const { data: albumPhotos, error: photoError } = await supabase
        .from("photos")
        .select("id, storage_path")
        .eq("event_id", event.id);

      if (photoError) throw photoError;

      const paths = (albumPhotos || [])
        .map((p) => p.storage_path)
        .filter(Boolean);

      if (paths.length > 0) {
        const { error: storageError } = await supabase.storage
          .from(BUCKET)
          .remove(paths);

        if (storageError) throw storageError;
      }

      const { error: deletePhotosError } = await supabase
        .from("photos")
        .delete()
        .eq("event_id", event.id);

      if (deletePhotosError) throw deletePhotosError;

      const { error: deleteEventError } = await supabase
        .from("events")
        .delete()
        .eq("id", event.id);

      if (deleteEventError) throw deleteEventError;

      setEvents((prev) => prev.filter((ev) => ev.id !== event.id));

      if (selectedEvent?.id === event.id) {
        setSelectedEvent(null);
        setPhotos([]);
      }

      showToast("Đã xóa album");
    } catch (error) {
      showToast(error.message || "Không thể xóa album", "error");
    }
  };

  const downloadImage = async (url, name = "family-photo") => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      a.remove();

      URL.revokeObjectURL(objectUrl);
    } catch {
      window.open(url, "_blank");
    }
  };

  const downloadAlbum = () => {
    if (!photos.length) {
      showToast("Album chưa có ảnh để tải", "error");
      return;
    }

    photos.forEach((photo, index) => {
      setTimeout(() => {
        downloadImage(photo.image_url, photo.title || `photo-${index + 1}.jpg`);
      }, index * 300);
    });

    showToast("Đang tải từng ảnh trong album");
  };

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const keyword = search.toLowerCase().trim();
      const tagsText = Array.isArray(event.tags)
        ? event.tags.join(" ")
        : event.tags || "";

      const matchKeyword =
        !keyword ||
        event.title?.toLowerCase().includes(keyword) ||
        event.description?.toLowerCase().includes(keyword) ||
        tagsText.toLowerCase().includes(keyword);

      const date = event.event_date ? new Date(event.event_date) : null;

      const matchMonth =
        !monthFilter || (date && String(date.getMonth() + 1) === monthFilter);

      const matchYear =
        !yearFilter || (date && String(date.getFullYear()) === yearFilter);

      return matchKeyword && matchMonth && matchYear;
    });
  }, [events, search, monthFilter, yearFilter]);

  const years = useMemo(() => {
    return [
      ...new Set(
        events
          .map((ev) =>
            ev.event_date ? String(new Date(ev.event_date).getFullYear()) : null
          )
          .filter(Boolean)
      ),
    ];
  }, [events]);

  const currentPhoto =
    lightboxIndex !== null && photos[lightboxIndex] ? photos[lightboxIndex] : null;

  const nextPhoto = () => {
    setLightboxIndex((prev) => (prev + 1) % photos.length);
  };

  const prevPhoto = () => {
    setLightboxIndex((prev) => (prev - 1 + photos.length) % photos.length);
  };

  return (
    <div className="min-h-screen bg-[#f8f3ec] text-slate-900">
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-rose-200/60 blur-3xl" />
        <div className="absolute top-32 right-0 h-[34rem] w-[34rem] rounded-full bg-amber-200/60 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-[28rem] w-[28rem] rounded-full bg-sky-200/50 blur-3xl" />
      </div>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -24 }}
            className={`fixed right-4 top-4 z-[100] rounded-2xl px-5 py-4 shadow-2xl backdrop-blur-xl ${
              toast.type === "error"
                ? "bg-red-500 text-white"
                : "bg-slate-950 text-white"
            }`}
          >
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {!selectedEvent ? (
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <section className="relative overflow-hidden rounded-[2rem] bg-white/55 p-6 shadow-2xl shadow-amber-900/10 ring-1 ring-white/70 backdrop-blur-xl sm:p-10">
            <div className="absolute right-8 top-8 hidden rounded-full bg-white/50 px-4 py-2 text-sm font-semibold text-amber-700 shadow-lg sm:block">
              <Sparkles className="mr-2 inline h-4 w-4" />
              Family Memories
            </div>

            <div className="max-w-3xl">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-amber-100 px-4 py-2 text-sm font-bold text-amber-800">
                <FolderHeart className="h-4 w-4" />
                Album ảnh gia đình
              </div>

              <h1 className="text-4xl font-black tracking-tight text-slate-950 sm:text-6xl">
                Lưu giữ từng khoảnh khắc đẹp của gia đình
              </h1>

              <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
                Tạo album theo sự kiện, upload ảnh, xem ảnh lớn, trình chiếu và
                quản lý kỷ niệm gia đình trong một giao diện hiện đại, ấm áp và
                dễ dùng.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <button
                  onClick={() => setShowCreate(true)}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-6 py-4 text-base font-bold text-white shadow-xl transition hover:scale-[1.02] hover:bg-slate-800"
                >
                  <Plus className="h-5 w-5" />
                  Tạo album mới
                </button>

                <button
                  onClick={fetchEvents}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white/70 px-6 py-4 text-base font-bold text-slate-800 shadow-lg ring-1 ring-slate-200 transition hover:bg-white"
                >
                  <Images className="h-5 w-5" />
                  Làm mới dữ liệu
                </button>
              </div>
            </div>
          </section>

          <section className="mt-6 grid gap-3 rounded-[1.5rem] bg-white/65 p-4 shadow-xl ring-1 ring-white/70 backdrop-blur-xl md:grid-cols-[1fr_160px_160px]">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm theo tên album, mô tả hoặc tag..."
                className="h-14 w-full rounded-2xl border border-slate-200 bg-white/80 pl-12 pr-4 text-base outline-none transition focus:border-slate-900"
              />
            </div>

            <select
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              className="h-14 rounded-2xl border border-slate-200 bg-white/80 px-4 outline-none transition focus:border-slate-900"
            >
              <option value="">Tất cả tháng</option>
              {Array.from({ length: 12 }).map((_, i) => (
                <option key={i + 1} value={i + 1}>
                  Tháng {i + 1}
                </option>
              ))}
            </select>

            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="h-14 rounded-2xl border border-slate-200 bg-white/80 px-4 outline-none transition focus:border-slate-900"
            >
              <option value="">Tất cả năm</option>
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </section>

          {loading ? (
            <LoadingState text="Đang tải album gia đình..." />
          ) : filteredEvents.length === 0 ? (
            <EmptyState
              title="Chưa có album phù hợp"
              description="Hãy tạo album mới hoặc thử thay đổi từ khóa tìm kiếm."
              action={() => setShowCreate(true)}
            />
          ) : (
            <section className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredEvents.map((event, index) => (
                <motion.article
                  key={event.id}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04 }}
                  whileHover={{ y: -6 }}
                  className="group overflow-hidden rounded-[2rem] bg-white/75 shadow-xl shadow-slate-900/10 ring-1 ring-white/80 backdrop-blur-xl"
                >
                  <button
                    onClick={() => openAlbum(event)}
                    className="block w-full text-left"
                  >
                    <div className="relative h-64 overflow-hidden bg-gradient-to-br from-amber-100 via-rose-100 to-sky-100">
                      {event.cover_url ? (
                        <img
                          src={event.cover_url}
                          alt={event.title}
                          className="h-full w-full object-cover transition duration-700 group-hover:scale-110"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <FolderHeart className="h-20 w-20 text-amber-600/60" />
                        </div>
                      )}

                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent" />

                      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                        <span className="rounded-full bg-white/90 px-3 py-2 text-sm font-bold text-slate-800 shadow-lg">
                          {event.photos?.length || 0} ảnh
                        </span>

                        <span className="rounded-full bg-slate-950/80 px-3 py-2 text-sm font-bold text-white shadow-lg">
                          Xem album
                        </span>
                      </div>
                    </div>

                    <div className="p-5">
                      <h2 className="line-clamp-2 text-2xl font-black text-slate-950">
                        {event.title}
                      </h2>

                      <div className="mt-3 flex items-center gap-2 text-sm font-semibold text-slate-500">
                        <Calendar className="h-4 w-4" />
                        {formatDate(event.event_date)}
                      </div>

                      {event.description && (
                        <p className="mt-3 line-clamp-2 text-slate-600">
                          {event.description}
                        </p>
                      )}

                      <TagList tags={event.tags} />
                    </div>
                  </button>

                  <div className="border-t border-slate-100 px-5 py-4">
                    <button
                      onClick={() => deleteAlbum(event)}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-red-50 px-4 py-3 font-bold text-red-600 transition hover:bg-red-100"
                    >
                      <Trash2 className="h-4 w-4" />
                      Xóa album
                    </button>
                  </div>
                </motion.article>
              ))}
            </section>
          )}
        </main>
      ) : (
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <section className="overflow-hidden rounded-[2rem] bg-slate-950 text-white shadow-2xl">
            <div className="relative min-h-[360px] p-6 sm:p-10">
              {selectedEvent.cover_url && (
                <img
                  src={selectedEvent.cover_url}
                  alt={selectedEvent.title}
                  className="absolute inset-0 h-full w-full object-cover opacity-35"
                />
              )}

              <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-950/80 to-slate-900/40" />

              <div className="relative z-10">
                <button
                  onClick={() => {
                    setSelectedEvent(null);
                    setPhotos([]);
                    setLightboxIndex(null);
                    setSlideshow(false);
                  }}
                  className="mb-8 inline-flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-3 font-bold backdrop-blur-xl transition hover:bg-white/20"
                >
                  <ArrowLeft className="h-5 w-5" />
                  Quay lại album
                </button>

                <div className="max-w-3xl">
                  <h1 className="text-4xl font-black sm:text-6xl">
                    {selectedEvent.title}
                  </h1>

                  <div className="mt-4 flex flex-wrap gap-3 text-sm font-bold text-white/85">
                    <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 backdrop-blur">
                      <Calendar className="h-4 w-4" />
                      {formatDate(selectedEvent.event_date)}
                    </span>

                    <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 backdrop-blur">
                      <Images className="h-4 w-4" />
                      {photos.length} ảnh
                    </span>
                  </div>

                  {selectedEvent.description && (
                    <p className="mt-5 text-lg leading-8 text-white/80">
                      {selectedEvent.description}
                    </p>
                  )}

                  <TagList tags={selectedEvent.tags} dark />
                </div>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => uploadPhotos(e.target.files)}
                  />

                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-6 py-4 font-black text-slate-950 shadow-xl transition hover:scale-[1.02] disabled:opacity-60"
                  >
                    {uploading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <UploadCloud className="h-5 w-5" />
                    )}
                    {uploading ? "Đang upload..." : "Upload ảnh"}
                  </button>

                  <button
                    onClick={() => photos.length && setLightboxIndex(0)}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white/10 px-6 py-4 font-black text-white backdrop-blur-xl transition hover:bg-white/20"
                  >
                    <Maximize2 className="h-5 w-5" />
                    Xem ảnh lớn
                  </button>

                  <button
                    onClick={downloadAlbum}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white/10 px-6 py-4 font-black text-white backdrop-blur-xl transition hover:bg-white/20"
                  >
                    <Archive className="h-5 w-5" />
                    Tải album
                  </button>
                </div>
              </div>
            </div>
          </section>

          {albumLoading ? (
            <LoadingState text="Đang tải ảnh trong album..." />
          ) : photos.length === 0 ? (
            <EmptyState
              title="Album này chưa có ảnh"
              description="Upload nhiều ảnh cùng lúc để bắt đầu lưu giữ kỷ niệm."
              action={() => fileInputRef.current?.click()}
            />
          ) : (
            <section className="mt-8 columns-1 gap-5 sm:columns-2 lg:columns-3">
              {photos.map((photo, index) => (
                <motion.div
                  key={photo.id}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="group mb-5 break-inside-avoid overflow-hidden rounded-[1.75rem] bg-white p-3 shadow-xl shadow-slate-900/10 ring-1 ring-white/80"
                >
                  <button
                    onClick={() => setLightboxIndex(index)}
                    className="block w-full overflow-hidden rounded-[1.35rem] bg-slate-100"
                  >
                    <img
                      src={photo.image_url}
                      alt={photo.title || "Family photo"}
                      className="w-full object-cover transition duration-700 group-hover:scale-105"
                      loading="lazy"
                    />
                  </button>

                  <div className="flex items-center justify-between gap-3 px-1 pt-3">
                    <p className="line-clamp-1 text-sm font-bold text-slate-700">
                      {photo.title || "Ảnh gia đình"}
                    </p>

                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          downloadImage(photo.image_url, photo.title || "photo.jpg")
                        }
                        className="rounded-xl bg-slate-100 p-2 text-slate-700 transition hover:bg-slate-200"
                      >
                        <Download className="h-4 w-4" />
                      </button>

                      <button
                        onClick={() => deletePhoto(photo)}
                        className="rounded-xl bg-red-50 p-2 text-red-600 transition hover:bg-red-100"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </section>
          )}
        </main>
      )}

      <AnimatePresence>
        {showCreate && (
          <Modal onClose={() => setShowCreate(false)}>
            <form onSubmit={createAlbum} className="space-y-4">
              <div>
                <h2 className="text-3xl font-black text-slate-950">
                  Tạo album mới
                </h2>
                <p className="mt-2 text-slate-500">
                  Nhập thông tin sự kiện để bắt đầu lưu ảnh.
                </p>
              </div>

              <Input
                label="Tên album"
                value={form.title}
                onChange={(value) => setForm({ ...form, title: value })}
                placeholder="Ví dụ: Sinh nhật mẹ 2026"
              />

              <Input
                label="Ngày sự kiện"
                type="date"
                value={form.event_date}
                onChange={(value) => setForm({ ...form, event_date: value })}
              />

              <div>
                <label className="mb-2 block font-bold text-slate-700">
                  Mô tả
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  placeholder="Ghi chú ngắn về kỷ niệm này..."
                  rows={4}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-slate-900"
                />
              </div>

              <Input
                label="Tag"
                value={form.tags}
                onChange={(value) => setForm({ ...form, tags: value })}
                placeholder="gia đình, sinh nhật, du lịch"
              />

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="flex-1 rounded-2xl bg-slate-100 px-5 py-4 font-black text-slate-700 transition hover:bg-slate-200"
                >
                  Hủy
                </button>

                <button
                  type="submit"
                  className="flex-1 rounded-2xl bg-slate-950 px-5 py-4 font-black text-white transition hover:bg-slate-800"
                >
                  Tạo album
                </button>
              </div>
            </form>
          </Modal>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {currentPhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] flex items-center justify-center bg-black/95 p-3 text-white"
          >
            <button
              onClick={() => {
                setLightboxIndex(null);
                setSlideshow(false);
              }}
              className="absolute right-4 top-4 z-20 rounded-full bg-white/10 p-3 backdrop-blur transition hover:bg-white/20"
            >
              <X className="h-6 w-6" />
            </button>

            {photos.length > 1 && (
              <>
                <button
                  onClick={prevPhoto}
                  className="absolute left-4 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white/10 p-4 backdrop-blur transition hover:bg-white/20"
                >
                  <ChevronLeft className="h-8 w-8" />
                </button>

                <button
                  onClick={nextPhoto}
                  className="absolute right-4 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white/10 p-4 backdrop-blur transition hover:bg-white/20"
                >
                  <ChevronRight className="h-8 w-8" />
                </button>
              </>
            )}

            <motion.img
              key={currentPhoto.id}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              src={currentPhoto.image_url}
              alt={currentPhoto.title || "Family photo"}
              className="max-h-[86vh] max-w-[94vw] rounded-2xl object-contain shadow-2xl"
            />

            <div className="absolute bottom-4 left-1/2 z-20 flex w-[calc(100%-2rem)] max-w-3xl -translate-x-1/2 items-center justify-between gap-3 rounded-3xl bg-white/10 p-3 backdrop-blur-xl">
              <div className="min-w-0 px-2">
                <p className="line-clamp-1 font-bold">
                  {currentPhoto.title || "Ảnh gia đình"}
                </p>
                <p className="text-sm text-white/60">
                  {lightboxIndex + 1} / {photos.length}
                </p>
              </div>

              <div className="flex shrink-0 gap-2">
                <button
                  onClick={() => setSlideshow((prev) => !prev)}
                  className="rounded-2xl bg-white px-4 py-3 font-black text-slate-950 transition hover:bg-slate-200"
                >
                  {slideshow ? (
                    <Pause className="h-5 w-5" />
                  ) : (
                    <Play className="h-5 w-5" />
                  )}
                </button>

                <button
                  onClick={() =>
                    downloadImage(
                      currentPhoto.image_url,
                      currentPhoto.title || "photo.jpg"
                    )
                  }
                  className="rounded-2xl bg-white px-4 py-3 font-black text-slate-950 transition hover:bg-slate-200"
                >
                  <Download className="h-5 w-5" />
                </button>

                <button
                  onClick={() => deletePhoto(currentPhoto)}
                  className="rounded-2xl bg-red-500 px-4 py-3 font-black text-white transition hover:bg-red-600"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Modal({ children, onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur"
    >
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 30, scale: 0.96 }}
        className="relative w-full max-w-xl rounded-[2rem] bg-white p-6 shadow-2xl"
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full bg-slate-100 p-2 text-slate-600 transition hover:bg-slate-200"
        >
          <X className="h-5 w-5" />
        </button>

        {children}
      </motion.div>
    </motion.div>
  );
}

function Input({ label, value, onChange, placeholder, type = "text" }) {
  return (
    <div>
      <label className="mb-2 block font-bold text-slate-700">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-14 w-full rounded-2xl border border-slate-200 bg-white px-4 outline-none transition focus:border-slate-900"
      />
    </div>
  );
}

function LoadingState({ text }) {
  return (
    <div className="mt-10 flex flex-col items-center justify-center rounded-[2rem] bg-white/70 p-12 text-center shadow-xl ring-1 ring-white/80">
      <Loader2 className="h-10 w-10 animate-spin text-slate-900" />
      <p className="mt-4 text-lg font-bold text-slate-700">{text}</p>
    </div>
  );
}

function EmptyState({ title, description, action }) {
  return (
    <div className="mt-10 flex flex-col items-center justify-center rounded-[2rem] bg-white/70 p-12 text-center shadow-xl ring-1 ring-white/80">
      <div className="rounded-full bg-amber-100 p-5">
        <ImagePlus className="h-12 w-12 text-amber-700" />
      </div>

      <h3 className="mt-5 text-2xl font-black text-slate-950">{title}</h3>
      <p className="mt-2 max-w-md text-slate-500">{description}</p>

      {action && (
        <button
          onClick={action}
          className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-6 py-4 font-black text-white transition hover:bg-slate-800"
        >
          <Plus className="h-5 w-5" />
          Thêm mới
        </button>
      )}
    </div>
  );
}

function TagList({ tags, dark = false }) {
  const list = Array.isArray(tags)
    ? tags
    : typeof tags === "string"
    ? tags.split(",").map((t) => t.trim())
    : [];

  if (!list.length) return null;

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {list.map((tag, index) => (
        <span
          key={`${tag}-${index}`}
          className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ${
            dark
              ? "bg-white/10 text-white backdrop-blur"
              : "bg-amber-50 text-amber-700"
          }`}
        >
          <Tag className="h-3 w-3" />
          {tag}
        </span>
      ))}
    </div>
  );
}

function normalizeTags(value) {
  if (!value) return [];

  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function formatDate(date) {
  if (!date) return "Chưa có ngày";

  try {
    return new Intl.DateTimeFormat("vi-VN", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }).format(new Date(date));
  } catch {
    return date;
  }
}