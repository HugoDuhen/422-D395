import { motion } from 'framer-motion';
import { Dumbbell, Images, Users, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const TILES = [
  { to: '/sport', label: 'Sport', icon: Dumbbell, desc: 'Infos et comptes-rendus sport' },
  { to: '/photos', label: 'Photos', icon: Images, desc: 'Drive photos de la section' },
];

export default function Dashboard() {
  const { user, hasRole } = useAuth();

  const tiles = [
    ...TILES,
    ...(hasRole('cadre') ? [{ to: '/annuaire', label: 'Annuaire', icon: Users, desc: 'Liste complète des membres' }] : []),
    ...(user?.isAdmin ? [{ to: '/admin', label: 'Admin', icon: Shield, desc: 'Comptes et rôles' }] : []),
  ];

  return (
    <div>
      <motion.h1
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mb-1 text-2xl font-semibold text-base-100"
      >
        Salut {user?.firstName} 👋
      </motion.h1>
      <p className="mb-6 text-sm text-base-400">Bienvenue sur l'espace de la section.</p>

      <div className="grid grid-cols-2 gap-3">
        {tiles.map(({ to, label, icon: Icon, desc }, i) => (
          <motion.div
            key={to}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Link
              to={to}
              className="flex h-full flex-col gap-3 rounded-xl border border-base-800 bg-base-900 p-4 transition-colors hover:border-accent-500/50"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-500/15">
                <Icon size={18} className="text-accent-400" />
              </div>
              <div>
                <p className="font-medium text-base-100">{label}</p>
                <p className="text-xs text-base-400">{desc}</p>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
