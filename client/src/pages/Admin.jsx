import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Pencil, X } from 'lucide-react';
import { api } from '../lib/api';

export default function Admin() {
  const [tab, setTab] = useState('membres');

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold text-base-100">Administration</h1>
      <div className="mb-4 flex gap-2">
        {['membres', 'rôles'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium capitalize ${
              tab === t ? 'bg-accent-500 text-base-950' : 'bg-base-800 text-base-300'
            }`}
          >
            {t}
          </button>
        ))}
      </div>
      {tab === 'membres' ? <MembersPanel /> : <RolesPanel />}
    </div>
  );
}

function MembersPanel() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // null | 'new' | user
  const [form, setForm] = useState(emptyForm());
  const [error, setError] = useState('');

  function emptyForm() {
    return { email: '', password: '', firstName: '', lastName: '', isAdmin: false, active: true, roleKeys: [] };
  }

  const load = async () => {
    setLoading(true);
    const [{ users }, { roles }] = await Promise.all([api.get('/users'), api.get('/roles')]);
    setUsers(users);
    setRoles(roles);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const openNew = () => {
    setForm(emptyForm());
    setError('');
    setEditing('new');
  };

  const openEdit = (u) => {
    setForm({ email: u.email, password: '', firstName: u.firstName, lastName: u.lastName, isAdmin: u.isAdmin, active: u.active, roleKeys: u.roles });
    setError('');
    setEditing(u);
  };

  const toggleRole = (key) => {
    setForm((f) => ({
      ...f,
      roleKeys: f.roleKeys.includes(key) ? f.roleKeys.filter((k) => k !== key) : [...f.roleKeys, key],
    }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (editing === 'new') {
        await api.post('/users', form);
      } else {
        const { email, ...rest } = form;
        const payload = rest.password ? rest : { ...rest, password: undefined };
        await api.put(`/users/${editing.id}`, payload);
      }
      setEditing(null);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const remove = async (id) => {
    if (!confirm('Supprimer ce membre ?')) return;
    try {
      await api.del(`/users/${id}`);
      load();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div>
      <div className="mb-3 flex justify-end">
        <button onClick={openNew} className="flex items-center gap-1.5 rounded-lg bg-accent-500 px-3 py-2 text-sm font-medium text-base-950">
          <Plus size={16} /> Nouveau membre
        </button>
      </div>

      {loading && <p className="text-sm text-base-500">Chargement...</p>}

      <div className="space-y-2">
        {users.map((u) => (
          <div key={u.id} className="flex items-center justify-between rounded-lg border border-base-800 bg-base-900 p-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-base-100">
                {u.firstName} {u.lastName} {!u.active && <span className="text-red-400">(inactif)</span>}
              </p>
              <p className="truncate text-xs text-base-500">{u.email}</p>
              <div className="mt-1 flex flex-wrap gap-1">
                {u.isAdmin && <span className="rounded-full bg-gold-500/15 px-2 py-0.5 text-[10px] font-medium text-gold-400">Admin</span>}
                {u.roles.map((r) => (
                  <span key={r} className="rounded-full bg-base-800 px-2 py-0.5 text-[10px] font-medium text-base-300">{r}</span>
                ))}
              </div>
            </div>
            <div className="flex shrink-0 gap-2">
              <button onClick={() => openEdit(u)} className="text-base-500 hover:text-accent-400">
                <Pencil size={15} />
              </button>
              <button onClick={() => remove(u.id)} className="text-base-500 hover:text-red-400">
                <Trash2 size={15} />
              </button>
            </div>
          </div>
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
              className="max-h-[90svh] w-full max-w-md overflow-y-auto rounded-t-2xl border border-base-800 bg-base-900 p-5 md:rounded-2xl"
            >
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-medium text-base-100">{editing === 'new' ? 'Nouveau membre' : 'Modifier'}</h2>
                <button type="button" onClick={() => setEditing(null)} className="text-base-500">
                  <X size={18} />
                </button>
              </div>

              <div className="mb-3 grid grid-cols-2 gap-2">
                <input
                  required
                  value={form.firstName}
                  onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                  placeholder="Prénom"
                  className="rounded-lg border border-base-700 bg-base-850 px-3 py-2.5 text-base-100 outline-none focus:border-accent-500"
                />
                <input
                  required
                  value={form.lastName}
                  onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                  placeholder="Nom"
                  className="rounded-lg border border-base-700 bg-base-850 px-3 py-2.5 text-base-100 outline-none focus:border-accent-500"
                />
              </div>
              <input
                required
                type="email"
                disabled={editing !== 'new'}
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="Email"
                className="mb-3 w-full rounded-lg border border-base-700 bg-base-850 px-3 py-2.5 text-base-100 outline-none focus:border-accent-500 disabled:opacity-50"
              />
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder={editing === 'new' ? 'Mot de passe' : 'Nouveau mot de passe (optionnel)'}
                required={editing === 'new'}
                className="mb-3 w-full rounded-lg border border-base-700 bg-base-850 px-3 py-2.5 text-base-100 outline-none focus:border-accent-500"
              />

              <p className="mb-1.5 text-xs text-base-400">Rôles</p>
              <div className="mb-3 flex flex-wrap gap-1.5">
                {roles.map((r) => (
                  <button
                    type="button"
                    key={r.key}
                    onClick={() => toggleRole(r.key)}
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      form.roleKeys.includes(r.key) ? 'bg-accent-500 text-base-950' : 'bg-base-800 text-base-300'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>

              <div className="mb-4 flex gap-4">
                <label className="flex items-center gap-2 text-sm text-base-300">
                  <input type="checkbox" checked={form.isAdmin} onChange={(e) => setForm({ ...form, isAdmin: e.target.checked })} />
                  Admin
                </label>
                <label className="flex items-center gap-2 text-sm text-base-300">
                  <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
                  Actif
                </label>
              </div>

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

function RolesPanel() {
  const [roles, setRoles] = useState([]);
  const [key, setKey] = useState('');
  const [label, setLabel] = useState('');
  const [error, setError] = useState('');

  const load = async () => {
    const { roles } = await api.get('/roles');
    setRoles(roles);
  };

  useEffect(() => {
    load();
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/roles', { key, label });
      setKey('');
      setLabel('');
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const remove = async (id) => {
    if (!confirm('Supprimer ce rôle ? Les membres qui l\'ont perdront cet accès.')) return;
    await api.del(`/roles/${id}`);
    load();
  };

  return (
    <div>
      <form onSubmit={submit} className="mb-4 flex flex-wrap gap-2 rounded-xl border border-base-800 bg-base-900 p-4">
        <input
          required
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Libellé (ex: Cuisine)"
          className="min-w-0 flex-1 rounded-lg border border-base-700 bg-base-850 px-3 py-2 text-sm text-base-100 outline-none focus:border-accent-500"
        />
        <input
          required
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="Clé (ex: cuisine)"
          className="min-w-0 flex-1 rounded-lg border border-base-700 bg-base-850 px-3 py-2 text-sm text-base-100 outline-none focus:border-accent-500"
        />
        <button type="submit" className="rounded-lg bg-accent-500 px-3 py-2 text-sm font-medium text-base-950">
          Ajouter
        </button>
        {error && <p className="w-full text-sm text-red-400">{error}</p>}
      </form>

      <div className="space-y-2">
        {roles.map((r) => (
          <div key={r.id} className="flex items-center justify-between rounded-lg border border-base-800 bg-base-900 p-3">
            <div>
              <p className="text-sm font-medium text-base-100">{r.label}</p>
              <p className="text-xs text-base-500">{r.key}</p>
            </div>
            <button onClick={() => remove(r.id)} className="text-base-500 hover:text-red-400">
              <Trash2 size={15} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
