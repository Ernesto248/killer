import {
  ArrowRightLeft,
  Bell,
  ClipboardList,
  Clock,
  LayoutDashboard,
  PlusCircle,
  Receipt,
  Settings,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";

export const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/nuevo", label: "Nuevo", icon: PlusCircle },
  { href: "/remeseros", label: "Remeseros", icon: Users },
  { href: "/cuadres", label: "Cuadres", icon: ClipboardList },
  { href: "/wires", label: "Wires", icon: TrendingUp },
  { href: "/zelle", label: "Zelle", icon: Wallet },
  { href: "/deudas", label: "Deudas", icon: Receipt },
  { href: "/proyectos", label: "Proyectos", icon: TrendingUp },
  { href: "/historial", label: "Historial", icon: Clock },
  { href: "/tesoreria/movimiento", label: "Compra/Venta USD", icon: ArrowRightLeft },
  { href: "/gastos", label: "Gastos", icon: Receipt },
  { href: "/alertas", label: "Alertas", icon: Bell },
  { href: "/config", label: "Config", icon: Settings },
] as const;
