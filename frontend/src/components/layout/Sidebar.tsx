import React, { useState } from 'react'
import { LogOut, Menu, User } from 'lucide-react'
import { ROLE_NAV } from '../../config/navigation'
import { MetaforgeLogo } from '../common/MetaforgeLogo'
import { ICONS, LayoutDashboard, ROLE_DASHBOARD_INFO, SidebarProps } from './sidebar.config'

export type { SidebarProps }

export function Sidebar({
  role,
  onLogout,
  activeNav = 'Dashboard',
  onNavSelect,
  collapsed: externalCollapsed,
  onToggleCollapse,
}: SidebarProps) {
  const [internalCollapsed, setInternalCollapsed] = useState(false)
  const isCollapsed = externalCollapsed !== undefined ? externalCollapsed : internalCollapsed

  const handleToggle = () => {
    if (onToggleCollapse) onToggleCollapse()
    else setInternalCollapsed(!internalCollapsed)
  }

  const sections = ROLE_NAV[role]
  const mainNavItems = sections.flatMap(s => s.items)
  const roleInfo = ROLE_DASHBOARD_INFO[role] || ROLE_DASHBOARD_INFO.recruiter
  const RoleIcon = roleInfo.icon

  return (
    <aside
      className={`${isCollapsed ? 'w-[72px]' : 'w-[260px]'
        } h-screen flex flex-col flex-shrink-0 transition-all duration-300 ease-in-out select-none relative z-20`}
      style={{
        background: 'linear-gradient(180deg, #0A1424 0%, #0B172A 50%, #0D1B30 100%)',
        boxShadow: '4px 0 24px rgba(0,0,0,0.12)',
      }}
    >
      {/* Header — metaforge logo + hamburger button */}
      <div className="h-[72px] flex items-center justify-between px-4 flex-shrink-0 border-b border-white/[0.06]">
        {!isCollapsed ? (
          <>
            <MetaforgeLogo variant="light" size="xl" />
            <button
              onClick={handleToggle}
              className="text-slate-300 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="Toggle menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          </>
        ) : (
          <button
            onClick={handleToggle}
            className="w-full flex items-center justify-center text-slate-300 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Expand menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Role / Dashboard Name Indicator */}
      <div className="px-3 pt-3 pb-2 flex-shrink-0 border-b border-white/[0.06]">
        {!isCollapsed ? (
          <div className="px-3 py-2.5 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center gap-3">
            <div
              className={`w-8 h-8 rounded-lg bg-gradient-to-br ${roleInfo.accentGradient} flex items-center justify-center text-white shrink-0 shadow-md`}
            >
              <RoleIcon className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 truncate">
                  {roleInfo.roleLabel}
                </span>
              </div>
              <p className="text-xs font-bold text-white tracking-tight truncate leading-snug">
                {roleInfo.dashboardName}
              </p>
            </div>
          </div>
        ) : (
          <div className="relative group flex justify-center py-1">
            <div
              className={`w-9 h-9 rounded-xl bg-gradient-to-br ${roleInfo.accentGradient} flex items-center justify-center text-white shadow-md cursor-default`}
            >
              <RoleIcon className="w-4 h-4" />
            </div>
            <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2.5 py-1.5 bg-slate-900 text-white text-xs rounded-md shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 border border-slate-700 font-semibold">
              {roleInfo.dashboardName}
            </div>
          </div>
        )}
      </div>

      {/* Primary navigation */}
      <nav className="flex-1 py-3 px-3 space-y-2 overflow-y-auto sidebar-scroll">
        {mainNavItems.map(item => {
          const Icon = ICONS[item.key] || LayoutDashboard
          const isActive = activeNav === item.key
          const label = item.label

          return (
            <div key={item.key} className="relative group">
              <button
                onClick={() => onNavSelect?.(item.key)}
                className={`w-full flex items-center gap-3 rounded-xl transition-all duration-200 ${isCollapsed ? 'justify-center py-2' : 'px-3 py-2'
                  } ${isActive
                    ? 'text-white font-bold shadow-md shadow-[#6B3BF6]/20'
                    : 'text-slate-300 hover:text-white hover:bg-white/[0.06] font-medium'
                  }`}
                style={
                  isActive
                    ? { background: 'linear-gradient(90deg, #6B3BF6 0%, #5833E0 100%)' }
                    : undefined
                }
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isActive ? 'bg-white/20' : 'bg-white/[0.08] group-hover:bg-white/12'
                    }`}
                >
                  <Icon className="w-4 h-4 text-white" strokeWidth={2} />
                </div>
                {!isCollapsed && <span className="text-sm font-semibold tracking-tight truncate">{label}</span>}
              </button>
              {isCollapsed && (
                <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2.5 py-1.5 bg-slate-900 text-white text-xs rounded-md shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 border border-slate-700">
                  {label}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      {/* Footer — My Profile + Logout */}
      <div className="p-3 border-t border-white/[0.06] space-y-2 flex-shrink-0 mt-auto">
        <div className="relative group">
          <button
            onClick={() => onNavSelect?.('My Profile')}
            className={`w-full flex items-center gap-3 rounded-xl transition-all ${isCollapsed ? 'justify-center py-2' : 'px-3 py-2'
              } ${activeNav === 'My Profile' || activeNav === 'Profile'
                ? 'text-white font-bold shadow-md shadow-[#6B3BF6]/20'
                : 'text-slate-300 hover:text-white hover:bg-white/[0.06] font-medium'
              }`}
            style={
              activeNav === 'My Profile' || activeNav === 'Profile'
                ? { background: 'linear-gradient(90deg, #6B3BF6 0%, #5833E0 100%)' }
                : undefined
            }
          >
            <div className="w-8 h-8 rounded-lg bg-white/[0.08] flex items-center justify-center shrink-0">
              <User className="w-4 h-4 text-white" strokeWidth={2} />
            </div>
            {!isCollapsed && <span className="text-sm font-semibold">My Profile</span>}
          </button>
        </div>

        {onLogout && (
          <div className="relative group">
            <button
              onClick={onLogout}
              className={`w-full flex items-center gap-3 rounded-xl text-slate-400 hover:text-rose-300 hover:bg-rose-500/10 transition-all ${isCollapsed ? 'justify-center py-2' : 'px-3 py-2'
                }`}
            >
              <div className="w-8 h-8 rounded-lg bg-white/[0.06] flex items-center justify-center shrink-0 group-hover:bg-rose-500/15">
                <LogOut className="w-4 h-4" strokeWidth={2} />
              </div>
              {!isCollapsed && <span className="text-sm font-semibold">Logout</span>}
            </button>
          </div>
        )}
      </div>
    </aside>
  )
}
