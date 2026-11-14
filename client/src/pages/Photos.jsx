import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Pencil, X, ExternalLink, Images } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';

export default function Photos() {
  const { user, hasRole } = useAuth();
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // null | 'new' | album
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  const canWrite = hasRole('photos');

  const load = async () => {
    setLoading(true);
    const { albums } = await api.get('/albums');
    setAlbums(albums);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const openNew = () => {
    setTitle('');
    setUrl('');
    setDescription('');
    setError('');
    setEditing('new');
  };

  const openEdit = (album) => {
    setTitle(album.title);
    setUrl(album.url);
    setDescription(album.description || '');
    setError('');
    setEditing(album);
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (editing === 'new') {
        await api.post('/albums', { title, url, description });
      } else {
        await api.put(`/albums/${editing.id}`, { title, url, description });
      }
      setEditing(null);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const remove = async (id) => {
    if (!confirm("Retirer cet album de la liste ? (le contenu reste sur iCloud)")) return;
    await api.del(`/albums/${id}`);
    load();
  };

  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-base-100">Photos</h1>
        {canWrite && (
          <button
            onClick={openNew}
            className="flex items-center gap-1.5 rounded-lg bg-accent-500 px-3 py-2 text-sm font-medium text-base-950"
          >
            <Plus size={16} /> Album
          </button>
        )}
      </div>
      <p className="mb-4 text-xs text-base-500">
        Les photos sont hébergées sur des albums partagés iCloud — ici, juste les liens.
      </p>

      {loading && <p className="text-sm text-base-500">Chargement...</p>}
      {!loading && albums.length === 0 && <p className="text-sm text-base-500">Aucun album pour l'instant.</p>}

      <div className="space-y-3">
        {albums.map((album) => (
          <motion.div
            key={album.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-base-800 bg-base-900 p-4"
          >
            <div className="mb-1 flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-500/15">
                  <Images size={15} className="text-accent-400" />
                </div>
                <h2 className="font-medium text-base-100">{album.title}</h2>
              </div>
              {(user?.isAdmin || album.addedById === user?.id) && canWrite && (
                <div className="flex shrink-0 gap-2">
                  <button onClick={() => openEdit(album)} className="text-base-500 hover:text-accent-400">
                    <Pencil size={15} />
                  </button>
                  <button onClick={() => remove(album.id)} className="text-base-500 hover:text-red-400">
                    <Trash2 size={15} />
                  </button>
                </div>
              )}
            </div>
            {album.description && <p className="mb-3 text-sm text-base-300">{album.description}</p>}
            <div className="flex items-center justify-between">
              <a
                href={album.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 rounded-lg bg-accent-500 px-3 py-2 text-sm font-medium text-base-950"
              >
                Ouvrir sur iCloud <ExternalLink size={14} />
              </a>
              <p className="text-xs text-base-500">
                {album.addedBy ? `${album.addedBy.firstName} ${album.addedBy.lastName}` : ''} ·{' '}
                {new Date(album.createdAt).toLocaleDateString('fr-FR')}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {editing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-20 flex items-end justify-center bg-black/60 md:items-center"
            onClick={() => setEditing(null)}
          >
            <motion.form
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              onSubmit={submit}
              className="w-full max-w-md rounded-t-2xl border border-base-800 bg-base-900 p-5 md:rounded-2xl"
            >
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-medium text-base-100">{editing === 'new' ? 'Nouvel album' : 'Modifier'}</h2>
                <button type="button" onClick={() => setEditing(null)} className="text-base-500">
                  <X size={18} />
                </button>
              </div>
              <input
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Titre (ex: Sortie du 12 octobre)"
                className="mb-3 w-full rounded-lg border border-base-700 bg-base-850 px-3 py-2.5 text-base-100 outline-none focus:border-accent-500"
              />
              <input
                required
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Lien de l'album partagé iCloud"
                className="mb-3 w-full rounded-lg border border-base-700 bg-base-850 px-3 py-2.5 text-base-100 outline-none focus:border-accent-500"
              />
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description (optionnel)"
                rows={3}
                className="mb-3 w-full resize-none rounded-lg border border-base-700 bg-base-850 px-3 py-2.5 text-base-100 outline-none focus:border-accent-500"
              />
              {error && <p className="mb-3 text-sm text-red-400">{error}</p>}
              <button type="submit" className="w-full rounded-lg bg-accent-500 px-4 py-2.5 font-medium text-base-950">
                Enregistrer
              </button>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
