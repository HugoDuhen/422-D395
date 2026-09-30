import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Pencil, X } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';

export default function Sport() {
  const { user, hasRole } = useAuth();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // null | 'new' | entry
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [error, setError] = useState('');

  const canWrite = hasRole('sport');

  const load = async () => {
    setLoading(true);
    const { entries } = await api.get('/sport');
    setEntries(entries);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const openNew = () => {
    setTitle('');
    setContent('');
    setError('');
    setEditing('new');
  };

  const openEdit = (entry) => {
    setTitle(entry.title);
    setContent(entry.content);
    setError('');
    setEditing(entry);
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (editing === 'new') {
        await api.post('/sport', { title, content });
      } else {
        await api.put(`/sport/${editing.id}`, { title, content });
      }
      setEditing(null);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const remove = async (id) => {
    if (!confirm('Supprimer cette publication ?')) return;
    await api.del(`/sport/${id}`);
    load();
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-base-100">Sport</h1>
        {canWrite && (
          <button
            onClick={openNew}
            className="flex items-center gap-1.5 rounded-lg bg-accent-500 px-3 py-2 text-sm font-medium text-base-950"
          >
            <Plus size={16} /> Ajouter
          </button>
        )}
      </div>

      {loading && <p className="text-sm text-base-500">Chargement...</p>}
      {!loading && entries.length === 0 && <p className="text-sm text-base-500">Aucune publication pour l'instant.</p>}

      <div className="space-y-3">
        {entries.map((entry) => (
          <motion.div
            key={entry.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-base-800 bg-base-900 p-4"
          >
            <div className="mb-1 flex items-start justify-between gap-2">
              <h2 className="font-medium text-base-100">{entry.title}</h2>
              {(user?.isAdmin || entry.authorId === user?.id) && canWrite && (
                <div className="flex shrink-0 gap-2">
                  <button onClick={() => openEdit(entry)} className="text-base-500 hover:text-accent-400">
                    <Pencil size={15} />
                  </button>
                  <button onClick={() => remove(entry.id)} className="text-base-500 hover:text-red-400">
                    <Trash2 size={15} />
                  </button>
                </div>
              )}
            </div>
            <p className="whitespace-pre-wrap text-sm text-base-300">{entry.content}</p>
            <p className="mt-2 text-xs text-base-500">
              {entry.author.firstName} {entry.author.lastName} · {new Date(entry.createdAt).toLocaleDateString('fr-FR')}
            </p>
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
                <h2 className="font-medium text-base-100">{editing === 'new' ? 'Nouvelle publication' : 'Modifier'}</h2>
                <button type="button" onClick={() => setEditing(null)} className="text-base-500">
                  <X size={18} />
                </button>
              </div>
              <input
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Titre"
                className="mb-3 w-full rounded-lg border border-base-700 bg-base-850 px-3 py-2.5 text-base-100 outline-none focus:border-accent-500"
              />
              <textarea
                required
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Contenu"
                rows={5}
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
