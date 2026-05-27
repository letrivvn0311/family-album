import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera,
  CalendarDays,
  Download,
  Heart,
  ImagePlus,
  Search,
  Sparkles,
  X,
  ChevronLeft,
  ChevronRight,
  Play,
  Grid3X3,
  Tags,
  Baby,
  Gift,
  Plane,
  Home,
  Loader2,
} from "lucide-react";
import { supabase } from "./supabase";

const cuteGradients = [
  "from-pink-200 via-rose-100 to-orange-100",
  "from-sky-200 via-cyan-100 to-teal-100",
  "from-violet-200 via-fuchsia-100 to-pink-100",
  "from-amber-200 via-yellow-100 to-lime-100",
  "from-emerald-200 via-teal-100 to-cyan-100",
];

const iconMap = { Baby, Gift, Plane, Home, Heart };

function formatDate(dateString) {
  if (!dateString) return "Chưa có ngày";
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(dateString));
}

function downloadImage(url, filename = "family-photo.jpg") {
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.target = "_blank";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function downloadEvent(event) {
  event.photos.forEach((photo, index) => {
    setTimeout(() => downloadImage(photo.url, `${event.title}-${index + 1}.jpg`), index * 250);
  });
}

export default function FamilyPhotoAlbum() {
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [queryText, setQueryText] = useState("");
  const [month, setMonth] = useState("all");
  const [year, setYear] = useState("all");
  const [activePhotoIndex, setActivePhotoIndex] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [newEvent, setNewEvent] = useState({
    title: "",
    date: "",
    description: "",
    tags: "",
  });

  async function loadData() {
    setLoading(true);
    setErrorMessage("");

    const { data: eventRows, error: eventError } = await supabase
      .from("events")
      .select("*")
      .order("created_at", { ascending: false });

    if (eventError) {
      setErrorMessage(eventError.message);
      setLoading(false);
      return;
    }

    const { data: photoRows, error: photoError } = await supabase
      .from("photos")
      .select("*")
      .order("created_at", { ascending: false });

    if (photoError) {
      setErrorMessage(photoError.message);
      setLoading(false);
      return;
    }

    const loadedEvents = (eventRows || []).map((event) => {
      const photos = (photoRows || [])
        .filter((photo) => photo.event_id === event.id)
        .map((photo) => ({
          id: photo.id,
          title: photo.title,
          url: photo.image_url,
          storagePath: photo.storage_path,
          createdAt: photo.created_at,
        }));

      return {
        id: event.id,
        title: event.title || "Album chưa đặt tên",
        date: event.event_date || "",
        description: event.description || "",
        tags: event.tags || [],
        cover:
          event.cover_url ||
          photos[0]?.url ||
          "https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=1200&q=80",
        iconName: event.icon_name || "Heart",
        photos,
      };
    });

    setEvents(loadedEvents);
    setSelectedEventId((current) => current || loadedEvents[0]?.id || null);
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  const years = useMemo(
    () => Array.from(new Set(events.filter((event) => event.date).map((event) => new Date(event.date).getFullYear()))),
    [events]
  );

  const filteredEvents = useMemo(() => {
    const keyword = queryText.trim().toLowerCase();
    return events.filter((event) => {
      const eventDate = event.date ? new Date(event.date) : null;
      const matchKeyword =
        !keyword ||
        event.title.toLowerCase().includes(keyword) ||
        event.description.toLowerCase().includes(keyword) ||
        event.tags.join(" ").toLowerCase().includes(keyword);
      const matchMonth = month === "all" || (eventDate && eventDate.getMonth() + 1 === Number(month));
      const matchYear = year === "all" || (eventDate && eventDate.getFullYear() === Number(year));
      return matchKeyword && matchMonth && matchYear;
    });
  }, [events, queryText, month, year]);

  const selectedEvent =
    filteredEvents.find((event) => event.id === selectedEventId) || filteredEvents[0] || events[0] || null;

  const activePhoto =
    activePhotoIndex !== null && selectedEvent?.photos?.[activePhotoIndex]
      ? selectedEvent.photos[activePhotoIndex]
      : null;

  async function handleCreateEvent(e) {
    e.preventDefault();
    if (!newEvent.title || !newEvent.date) return;

    setSaving(true);
    setErrorMessage("");

    const { data, error } = await supabase
      .from("events")
      .insert({
        title: newEvent.title,
        event_date: newEvent.date,
        description: newEvent.description || "Một album mới đang chờ cả nhà thêm thật nhiều ảnh xinh.",
        tags: newEvent.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
        cover_url: "",
        icon_name: "Baby",
      })
      .select()
      .single();

    if (error) {
      setErrorMessage(error.message);
      setSaving(false);
      return;
    }

    setNewEvent({ title: "", date: "", description: "", tags: "" });
    setSelectedEventId(data.id);
    await loadData();
    setSaving(false);
  }

  async function handleUploadPhotos(files) {
    if (!selectedEvent || !files?.length) return;
    setUploading(true);
    setErrorMessage("");

    for (const file of Array.from(files)) {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
      const storagePath = `${selectedEvent.id}/${Date.now()}-${safeName}`;

      const { error: uploadError } = await supabase.storage
        .from("family-photos")
        .upload(storagePath, file, { upsert: false });

      if (uploadError) {
        setErrorMessage(uploadError.message);
        setUploading(false);
        return;
      }

      const { data: publicUrlData } = supabase.storage
        .from("family-photos")
        .getPublicUrl(storagePath);

      const imageUrl = publicUrlData.publicUrl;

      const { error: photoError } = await supabase.from("photos").insert({
        event_id: selectedEvent.id,
        title: file.name.replace(/\.[^/.]+$/, ""),
        image_url: imageUrl,
        storage_path: storagePath,
      });

      if (photoError) {
        setErrorMessage(photoError.message);
        setUploading(false);
        return;
      }

      if (!selectedEvent.cover || selectedEvent.photos.length === 0) {
        await supabase
          .from("events")
          .update({ cover_url: imageUrl })
          .eq("id", selectedEvent.id);
      }
    }

    await loadData();
    setUploading(false);
  }

  function nextPhoto() {
    if (!selectedEvent?.photos?.length) return;
    setActivePhotoIndex((current) =>
      current === null ? 0 : (current + 1) % selectedEvent.photos.length
    );
  }

  function previousPhoto() {
    if (!selectedEvent?.photos?.length) return;
    setActivePhotoIndex((current) =>
      current === null
        ? 0
        : (current - 1 + selectedEvent.photos.length) % selectedEvent.photos.length
    );
  }

  return (
    <div className="min-h-screen overflow-hidden bg-gradient-to-br from-rose-50 via-orange-50 to-sky-50 text-slate-800">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <motion.div animate={{ y: [0, -16, 0], rotate: [0, 3, 0] }} transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }} className="absolute left-8 top-20 h-28 w-28 rounded-full bg-pink-200/40 blur-2xl" />
        <motion.div animate={{ y: [0, 20, 0], rotate: [0, -4, 0] }} transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }} className="absolute bottom-20 right-12 h-36 w-36 rounded-full bg-cyan-200/40 blur-2xl" />
      </div>

      <header className="relative mx-auto max-w-7xl px-4 pb-8 pt-8 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="rounded-[2rem] border border-white/70 bg-white/70 p-6 shadow-xl shadow-rose-100/70 backdrop-blur md:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-rose-100 px-4 py-2 text-sm font-semibold text-rose-600"><Sparkles className="h-4 w-4" /> Album kỷ niệm gia đình</div>
              <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-5xl">Lưu giữ từng khoảnh khắc yêu thương</h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">Dữ liệu đang được lưu thật bằng Supabase Database và hình ảnh lưu bằng Supabase Storage.</p>
            </div>
            <div className="grid grid-cols-3 gap-3 rounded-[1.5rem] bg-gradient-to-br from-pink-100 to-orange-100 p-4 text-center shadow-inner">
              <div><p className="text-2xl font-black text-rose-600">{events.length}</p><p className="text-xs font-semibold text-slate-500">Sự kiện</p></div>
              <div><p className="text-2xl font-black text-orange-500">{events.reduce((sum, event) => sum + event.photos.length, 0)}</p><p className="text-xs font-semibold text-slate-500">Hình ảnh</p></div>
              <div><p className="text-2xl font-black text-pink-500">♡</p><p className="text-xs font-semibold text-slate-500">Yêu thương</p></div>
            </div>
          </div>
        </motion.div>
      </header>

      <main className="relative mx-auto grid max-w-7xl gap-6 px-4 pb-12 sm:px-6 lg:grid-cols-[360px_1fr] lg:px-8">
        <aside className="space-y-6">
          {errorMessage && <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-600">Lỗi: {errorMessage}</div>}
          <motion.section initial={{ opacity: 0, x: -18 }} animate={{ opacity: 1, x: 0 }} className="rounded-[2rem] border border-white/80 bg-white/75 p-5 shadow-xl shadow-pink-100/60 backdrop-blur">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-black"><Search className="h-5 w-5 text-rose-500" /> Tìm & lọc ảnh</h2>
            <div className="space-y-3">
              <div className="relative"><Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={queryText} onChange={(e) => setQueryText(e.target.value)} placeholder="Tìm sự kiện, mô tả, tag..." className="w-full rounded-2xl border border-rose-100 bg-white px-11 py-3 text-sm outline-none transition focus:border-rose-300 focus:ring-4 focus:ring-rose-100" /></div>
              <div className="grid grid-cols-2 gap-3">
                <select value={month} onChange={(e) => setMonth(e.target.value)} className="rounded-2xl border border-rose-100 bg-white px-4 py-3 text-sm outline-none focus:ring-4 focus:ring-rose-100"><option value="all">Tất cả tháng</option>{Array.from({ length: 12 }, (_, i) => i + 1).map((item) => <option key={item} value={item}>Tháng {item}</option>)}</select>
                <select value={year} onChange={(e) => setYear(e.target.value)} className="rounded-2xl border border-rose-100 bg-white px-4 py-3 text-sm outline-none focus:ring-4 focus:ring-rose-100"><option value="all">Tất cả năm</option>{years.map((item) => <option key={item} value={item}>{item}</option>)}</select>
              </div>
            </div>
          </motion.section>

          <motion.section initial={{ opacity: 0, x: -18 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.08 }} className="rounded-[2rem] border border-white/80 bg-white/75 p-5 shadow-xl shadow-pink-100/60 backdrop-blur">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-black"><ImagePlus className="h-5 w-5 text-pink-500" /> Tạo sự kiện mới</h2>
            <form onSubmit={handleCreateEvent} className="space-y-3">
              <input value={newEvent.title} onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })} placeholder="Tên sự kiện" className="w-full rounded-2xl border border-pink-100 bg-white px-4 py-3 text-sm outline-none focus:ring-4 focus:ring-pink-100" />
              <input value={newEvent.date} onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })} type="date" className="w-full rounded-2xl border border-pink-100 bg-white px-4 py-3 text-sm outline-none focus:ring-4 focus:ring-pink-100" />
              <textarea value={newEvent.description} onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })} placeholder="Mô tả kỷ niệm" rows={3} className="w-full rounded-2xl border border-pink-100 bg-white px-4 py-3 text-sm outline-none focus:ring-4 focus:ring-pink-100" />
              <input value={newEvent.tags} onChange={(e) => setNewEvent({ ...newEvent, tags: e.target.value })} placeholder="Tag, cách nhau bằng dấu phẩy" className="w-full rounded-2xl border border-pink-100 bg-white px-4 py-3 text-sm outline-none focus:ring-4 focus:ring-pink-100" />
              <button disabled={saving} className="w-full rounded-2xl bg-gradient-to-r from-rose-400 to-orange-300 px-4 py-3 text-sm font-black text-white shadow-lg shadow-rose-200 transition hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60">{saving ? "Đang lưu..." : "Thêm album đáng yêu"}</button>
            </form>
          </motion.section>
        </aside>

        <section className="space-y-6">
          {loading ? (
            <div className="rounded-[2rem] border border-white/80 bg-white/75 p-10 text-center shadow-xl"><Loader2 className="mx-auto h-8 w-8 animate-spin text-rose-400" /><p className="mt-3 font-bold text-slate-600">Đang tải dữ liệu từ Supabase...</p></div>
          ) : events.length === 0 ? (
            <div className="rounded-[2rem] border border-white/80 bg-white/75 p-10 text-center shadow-xl"><Heart className="mx-auto h-10 w-10 text-rose-400" /><p className="mt-3 font-bold text-slate-700">Chưa có album nào. Hãy tạo sự kiện đầu tiên ở form bên trái.</p></div>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <AnimatePresence mode="popLayout">
                  {filteredEvents.map((event, index) => {
                    const Icon = iconMap[event.iconName] || Heart;
                    return (
                      <motion.button layout key={event.id} initial={{ opacity: 0, y: 20, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12, scale: 0.96 }} transition={{ delay: index * 0.03 }} onClick={() => setSelectedEventId(event.id)} className={`group overflow-hidden rounded-[2rem] border text-left shadow-xl transition hover:-translate-y-1 hover:shadow-2xl ${selectedEvent?.id === event.id ? "border-rose-300 bg-white" : "border-white/80 bg-white/75"}`}>
                        <div className="relative h-40 overflow-hidden"><img src={event.cover} alt={event.title} className="h-full w-full object-cover transition duration-700 group-hover:scale-110" /><div className={`absolute inset-0 bg-gradient-to-t ${cuteGradients[index % cuteGradients.length]} opacity-40`} /><div className="absolute left-4 top-4 rounded-2xl bg-white/85 p-3 shadow-lg backdrop-blur"><Icon className="h-5 w-5 text-rose-500" /></div></div>
                        <div className="p-5"><h3 className="text-lg font-black text-slate-900">{event.title}</h3><p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{event.description}</p><div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-bold text-slate-500"><span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-3 py-1 text-rose-500"><CalendarDays className="h-3.5 w-3.5" /> {formatDate(event.date)}</span><span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-3 py-1 text-sky-500"><Camera className="h-3.5 w-3.5" /> {event.photos.length} ảnh</span></div></div>
                      </motion.button>
                    );
                  })}
                </AnimatePresence>
              </div>

              {selectedEvent && (
                <motion.div key={selectedEvent.id} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="rounded-[2rem] border border-white/80 bg-white/80 p-5 shadow-xl shadow-sky-100/60 backdrop-blur md:p-6">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between"><div><div className="mb-2 inline-flex items-center gap-2 rounded-full bg-pink-100 px-3 py-1 text-xs font-black text-pink-600"><Heart className="h-3.5 w-3.5" /> Album đang xem</div><h2 className="text-2xl font-black text-slate-900">{selectedEvent.title}</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{selectedEvent.description}</p><div className="mt-3 flex flex-wrap gap-2">{selectedEvent.tags.map((tag) => <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-3 py-1 text-xs font-bold text-orange-500"><Tags className="h-3 w-3" /> {tag}</span>)}</div></div><div className="flex flex-wrap gap-2"><label className="cursor-pointer rounded-2xl bg-slate-900 px-4 py-3 text-sm font-black text-white shadow-lg transition hover:scale-[1.02]"><input type="file" accept="image/*" multiple onChange={(e) => handleUploadPhotos(e.target.files)} className="hidden" /><span className="inline-flex items-center gap-2"><ImagePlus className="h-4 w-4" /> {uploading ? "Đang upload..." : "Upload ảnh"}</span></label><button onClick={() => selectedEvent.photos.length && setActivePhotoIndex(0)} className="rounded-2xl bg-rose-400 px-4 py-3 text-sm font-black text-white shadow-lg shadow-rose-200 transition hover:scale-[1.02]"><span className="inline-flex items-center gap-2"><Play className="h-4 w-4" /> Trình chiếu</span></button><button onClick={() => downloadEvent(selectedEvent)} className="rounded-2xl bg-orange-300 px-4 py-3 text-sm font-black text-white shadow-lg shadow-orange-100 transition hover:scale-[1.02]"><span className="inline-flex items-center gap-2"><Download className="h-4 w-4" /> Tải album</span></button></div></div>
                  <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{selectedEvent.photos.length === 0 ? (<div className="col-span-full rounded-[2rem] border border-dashed border-rose-200 bg-rose-50/60 p-10 text-center"><Grid3X3 className="mx-auto h-10 w-10 text-rose-400" /><p className="mt-3 font-bold text-slate-700">Album này chưa có ảnh. Hãy upload những khoảnh khắc đầu tiên nhé.</p></div>) : (selectedEvent.photos.map((photo, index) => (<motion.div layout key={photo.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="group overflow-hidden rounded-[1.6rem] bg-white shadow-lg shadow-slate-100"><button onClick={() => setActivePhotoIndex(index)} className="block h-52 w-full overflow-hidden"><img src={photo.url} alt={photo.title} className="h-full w-full object-cover transition duration-700 group-hover:scale-110" /></button><div className="flex items-center justify-between gap-3 p-4"><p className="truncate text-sm font-black text-slate-700">{photo.title}</p><button onClick={() => downloadImage(photo.url, `${photo.title}.jpg`)} className="rounded-full bg-pink-50 p-2 text-pink-500 transition hover:bg-pink-100" title="Tải ảnh"><Download className="h-4 w-4" /></button></div></motion.div>)))}</div>
                </motion.div>
              )}
            </>
          )}
        </section>
      </main>

      <AnimatePresence>
        {activePhoto && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 p-4 backdrop-blur">
            <button onClick={() => setActivePhotoIndex(null)} className="absolute right-5 top-5 rounded-full bg-white/10 p-3 text-white transition hover:bg-white/20"><X className="h-6 w-6" /></button>
            <button onClick={previousPhoto} className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white transition hover:bg-white/20"><ChevronLeft className="h-7 w-7" /></button>
            <button onClick={nextPhoto} className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white transition hover:bg-white/20"><ChevronRight className="h-7 w-7" /></button>
            <motion.div key={activePhoto.id} initial={{ opacity: 0, scale: 0.92, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.92, y: 20 }} transition={{ type: "spring", stiffness: 180, damping: 22 }} className="max-h-[86vh] w-full max-w-5xl overflow-hidden rounded-[2rem] bg-white shadow-2xl"><img src={activePhoto.url} alt={activePhoto.title} className="max-h-[72vh] w-full object-contain bg-slate-900" /><div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-lg font-black text-slate-900">{activePhoto.title}</p><p className="text-sm text-slate-500">{activePhotoIndex + 1} / {selectedEvent.photos.length} · {selectedEvent.title}</p></div><button onClick={() => downloadImage(activePhoto.url, `${activePhoto.title}.jpg`)} className="rounded-2xl bg-gradient-to-r from-rose-400 to-orange-300 px-5 py-3 text-sm font-black text-white shadow-lg shadow-rose-200"><span className="inline-flex items-center gap-2"><Download className="h-4 w-4" /> Tải ảnh này</span></button></div></motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
