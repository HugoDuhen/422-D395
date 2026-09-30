import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Download, Trash2, X } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';

export default function Photos() {
  const { user, hasRole } = useAuth();
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [folder, setFolder] = useState('Toutes');
  const [uploads, setUploads] = useState([]); // [{name, progress}]
  const [selected, setSelected] = useState(null);
  const inputRef = useRef(null);

  const canUpload = hasRole('photos');

  const load = async () => {
    setLoading(true);
    const { photos } = await api.get('/photos');
    setPhotos(photos);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const folders = ['Toutes', ...new Set(photos.map((p) => p.folder))];
  const visible = folder === 'Toutes' ? photos : photos.filter((p) => p.folder === folder);

  const onPick = async (e) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = '';
    if (files.length === 0) return;

    const targetFolder = folder === 'Toutes' ? 'General' : folder;
    const batchName = `${files.length} fichier${files.length > 1 ? 's' : ''}`;
    setUploads((u) => [...u, { name: batchName, progress: 0 }]);

    const formData = new FormData();
    files.forEach((f) => formData.append('files', f));
    formData.append('folder', targetFolder);

    try {
      await api.upload('/photos/upload', formData, (progress) => {
        setUploads((u) => u.map((up) => (up.name === batchName ? { ...up, progress } : up)));
      });
      setUploads((u) => u.filter((up) => up.name !== batchName));
      load();
    } catch (err) {
      setUploads((u) => u.map((up) => (up.name === batchName ? { ...up, error: err.message } : up)));
    }
  };

  const remove = async (id) => {
    if (!confirm('Supprimer cette photo ?')) return;
    await api.del(`/photos/${id}`);
    setSelected(null);
    load();
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-base-100">Photos</h1>
        {canUpload && (
          <>
            <input ref={inputRef} type="file" accept="image/*" multiple hidden onChange={onPick} />
            <button
              onClick={() => inputRef.current?.click()}
              className="flex items-center gap-1.5 rounded-lg bg-accent-500 px-3 py-2 text-sm font-medium text-base-950"
            >
              <Upload size={16} /> Envoyer
            </button>
          </>
        )}
      </div>

      {uploads.length > 0 && (
        <div className="mb-4 space-y-2">
          {uploads.map((u) => (
            <div key={u.name} className="rounded-lg border border-base-800 bg-base-900 p-3 text-sm">
              <div className="mb-1.5 flex justify-between text-base-300">
                <span>{u.name}</span>
                <span>{u.error ? 'Échec' : `${u.progress}%`}</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-base-800">
                <div
                  className={`h-full rounded-full ${u.error ? 'bg-red-500' : 'bg-accent-500'}`}
                  style={{ width: `${u.error ? 100 : u.progress}%` }}
                />
              </div>
              {u.error && <p className="mt-1 text-xs text-red-400">{u.error}</p>}
            </div>
          ))}
        </div>
      )}

      {folders.length > 1 && (
        <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
          {folders.map((f) => (
            <button
              key={f}
              onClick={() => setFolder(f)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium ${
                folder === f ? 'bg-accent-500 text-base-950' : 'bg-base-800 text-base-300'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      )}

      {loading && <p className="text-sm text-base-500">Chargement...</p>}
      {!loading && visible.length === 0 && <p className="text-sm text-base-500">Aucune photo pour l'instant.</p>}

      <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-4">
        {visible.map((photo) => (
          <motion.button
            key={photo.id}
            layoutId={`photo-${photo.id}`}
            onClick={() => setSelected(photo)}
            className="aspect-square overflow-hidden rounded-lg bg-base-800"
          >
            <img
              src={`/api/photos/${photo.id}/preview`}
              alt={photo.originalName}
              loading="lazy"
              className="h-full w-full object-cover"
            />
          </motion.button>
        ))}
      </div>

      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-20 flex flex-col bg-black/95"
            onClick={() => setSelected(null)}
          >
            <div className="flex items-center justify-between p-4" onClick={(e) => e.stopPropagation()}>
              <p className="truncate text-sm text-base-300">{selected.originalName}</p>
              <button onClick={() => setSelected(null)} className="text-base-300">
                <X size={22} />
              </button>
            </div>
            <div className="flex flex-1 items-center justify-center overflow-hidden px-2">
              <motion.img
                layoutId={`photo-${selected.id}`}
                src={`/api/photos/${selected.id}/preview`}
                alt={selected.originalName}
                className="max-h-full max-w-full object-contain"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            <div
              className="flex items-center justify-center gap-3 p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)]"
              onClick={(e) => e.stopPropagation()}
            >
              <a
                href={`/api/photos/${selected.id}/download`}
                className="flex items-center gap-1.5 rounded-lg bg-accent-500 px-4 py-2.5 text-sm font-medium text-base-950"
              >
                <Download size={16} /> Qualité max
              </a>
              {(user?.isAdmin || selected.uploaderId === user?.id) && (
                <button
                  onClick={() => remove(selected.id)}
                  className="flex items-center gap-1.5 rounded-lg border border-base-700 px-4 py-2.5 text-sm font-medium text-red-400"
                >
                  <Trash2 size={16} /> Supprimer
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
