import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getPedidos, getProductos, getUsuarios } from "../api/endpoints";
import { StatSkeleton } from "../components/Skeleton";

const statIcons = {
  pedidos: (
    <svg
      className="w-8 h-8"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.6}
        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
      />
    </svg>
  ),
  productos: (
    <svg
      className="w-8 h-8"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.6}
        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
      />
    </svg>
  ),
  usuarios: (
    <svg
      className="w-8 h-8"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.6}
        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
      />
    </svg>
  ),
};

const shortcutCards = [
  {
    to: "/pedidos",
    label: "Pedidos",
    desc: "Ver y gestionar pedidos",
    icon: "📦",
    color: "from-amber-500 to-orange-600",
    roles: ["ADMIN", "PEDIDOS"],
  },
  {
    to: "/productos",
    label: "Productos",
    desc: "Administrar menú",
    icon: "🍕",
    color: "from-red-500 to-rose-600",
    roles: ["ADMIN", "STOCK"],
  },
  {
    to: "/usuarios",
    label: "Usuarios",
    desc: "Gestionar accesos",
    icon: "👥",
    color: "from-violet-500 to-purple-600",
    roles: ["ADMIN"],
  },
  {
    to: "/categorias",
    label: "Categorías",
    desc: "Organizar productos",
    icon: "📂",
    color: "from-emerald-500 to-teal-600",
    roles: ["ADMIN"],
  },
  {
    to: "/ingredientes",
    label: "Ingredientes",
    desc: "Controlar stock",
    icon: "🥬",
    color: "from-lime-500 to-green-600",
    roles: ["ADMIN"],
  },
];

function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ pedidos: 0, productos: 0, usuarios: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const fetchStats = async () => {
      try {
        const [pedidosRes, productosRes, usuariosRes] = await Promise.all([
          getPedidos({ limit: 1 }),
          getProductos({ limit: 1 }),
          getUsuarios({ limit: 1 }),
        ]);
        if (!cancelled) {
          setStats({
            pedidos: pedidosRes.data.total || 0,
            productos: productosRes.data.total || 0,
            usuarios: usuariosRes.data.total || 0,
          });
        }
      } catch {
        if (!cancelled) {
          setStats({ pedidos: 0, productos: 0, usuarios: 0 });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchStats();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div>
        <div className="mb-8">
          <div className="h-8 w-36 bg-stone-200 dark:bg-stone-700/50 rounded-lg animate-pulse mb-2" />
          <div className="h-4 w-64 bg-stone-100 dark:bg-stone-700/30 rounded animate-pulse" />
        </div>
        <div className="dashboard-stats max-w-3xl mx-auto">
          <StatSkeleton />
          <StatSkeleton />
          <StatSkeleton />
        </div>
      </div>
    );
  }

  const role = user?.rol || "";
  const visibleShortcuts = shortcutCards.filter((s) => s.roles.includes(role));

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-50 mb-1">
          Bienvenido, {user?.nombre || "Admin"}
        </h1>
        <p className="text-sm text-stone-500 dark:text-stone-400">
          Resumen general del sistema
        </p>
      </div>

      <div className="dashboard-stats max-w-3xl mx-auto">
        {[
          {
            key: "pedidos",
            label: "Pedidos totales",
            value: stats.pedidos,
            href: "/pedidos",
          },
          {
            key: "productos",
            label: "Productos activos",
            value: stats.productos,
            href: "/productos",
          },
          {
            key: "usuarios",
            label: "Usuarios registrados",
            value: stats.usuarios,
            href: "/usuarios",
          },
        ].map((stat) => (
          <Link
            key={stat.key}
            to={stat.href}
            className="stat-card group cursor-pointer"
          >
            <div className="flex items-start justify-between mb-3">
              <span className="p-2.5 rounded-xl bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 group-hover:bg-orange-100 dark:group-hover:bg-orange-500/20 transition-colors">
                {statIcons[stat.key]}
              </span>
              <svg
                className="w-5 h-5 text-stone-300 dark:text-stone-600 group-hover:text-orange-500 dark:group-hover:text-orange-400 transition-colors -rotate-45"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 17L17 7M7 7h10v10"
                />
              </svg>
            </div>
            <div className="stat-title">{stat.label}</div>
            <div className="stat-value group-hover:scale-105 transition-transform origin-left">
              {stat.value.toLocaleString()}
            </div>
          </Link>
        ))}
      </div>

      <div className="mb-6">
        <h2 className="section-title">Acciones rápidas</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
          {visibleShortcuts.map((sc) => (
            <Link
              key={sc.to}
              to={sc.to}
              className="card group hover:shadow-lg hover:-translate-y-1 transition-all duration-200 cursor-pointer relative overflow-hidden"
              style={{ padding: "24px" }}
            >
              <div
                className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl ${sc.color} opacity-10 dark:opacity-15 rounded-bl-full group-hover:opacity-20 dark:group-hover:opacity-25 transition-opacity`}
              />
              <div className="text-3xl mb-3">{sc.icon}</div>
              <h3 className="font-semibold text-stone-800 dark:text-stone-100 mb-1">
                {sc.label}
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                {sc.desc}
              </p>
            </Link>
          ))}
        </div>
      </div>

      <div className="card max-w-2xl mx-auto">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-orange-50 dark:bg-orange-500/10 flex-shrink-0">
            <svg
              className="w-6 h-6 text-orange-600 dark:text-orange-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.8}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-stone-800 dark:text-stone-100 mb-1">
              Panel de Administración
            </h3>
            <p className="text-sm text-stone-500 dark:text-stone-400 leading-relaxed">
              Desde este panel podés gestionar pedidos, productos, usuarios y
              más. Usá el menú lateral para navegar entre las secciones.
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-stone-100 dark:bg-stone-800 text-xs text-stone-600 dark:text-stone-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Pedidos en tiempo real
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-stone-100 dark:bg-stone-800 text-xs text-stone-600 dark:text-stone-300">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                Modo oscuro disponible
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
