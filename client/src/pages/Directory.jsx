import { useEffect, useState } from 'react';
import { api } from '../lib/api';

export default function Directory() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/users/directory').then(({ users }) => {
      setUsers(users);
      setLoading(false);
    });
  }, []);

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold text-base-100">Annuaire</h1>
      {loading && <p className="text-sm text-base-500">Chargement...</p>}
      <div className="space-y-2">
        {users.map((u) => (
          <div key={u.id} className="flex items-center justify-between rounded-lg border border-base-800 bg-base-900 p-3">
            <div>
              <p className="text-sm font-medium text-base-100">{u.firstName} {u.lastName}</p>
              <p className="text-xs text-base-500">{u.email}</p>
            </div>
            <div className="flex gap-1.5">
              {u.isAdmin && <span className="rounded-full bg-gold-500/15 px-2 py-0.5 text-[10px] font-medium text-gold-400">Admin</span>}
              {u.roles.map((r) => (
                <span key={r} className="rounded-full bg-base-800 px-2 py-0.5 text-[10px] font-medium text-base-300">{r}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
