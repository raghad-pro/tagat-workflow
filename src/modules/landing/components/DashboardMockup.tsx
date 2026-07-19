'use client'

import { useApp } from '../context/AppContext'
import { LogoMark } from './Icons'

// A pure CSS/HTML recreation of the product dashboard shown in the hero.
// Rendering it as markup (instead of a large PNG) keeps the page light,
// razor sharp on any screen, and lets it translate with the site language.

const bars = [42, 55, 48, 68, 63, 74]
const growthBars = [30, 45, 38, 60, 52, 70]

export default function DashboardMockup({ compact = false }: any) {
  const { t } = useApp()
  const d = t.dashboard

  const menu = [
    { section: d.menu.home, items: [{ label: d.menu.dashboard, active: true }] },
    {
      section: d.menu.subscriberMgmt,
      items: [{ label: d.menu.companies }, { label: d.menu.companyRequests }, { label: d.menu.clients }],
    },
    {
      section: d.menu.financialMgmt,
      items: [{ label: d.menu.invoices }, { label: d.menu.payments }, { label: d.menu.wallets }, { label: d.menu.currencies }],
    },
    {
      section: d.menu.internalOps,
      items: [{ label: d.menu.roles }, { label: d.menu.employees }, { label: d.menu.projects }, { label: d.menu.tasks }],
    },
  ]

  const companies = [
    { name: 'Advanced Tech Company', badge: 'Enterprise', amount: '$1,500', tone: 'gold' },
    { name: 'Innovation Institute', badge: 'Pro', amount: '$499', tone: 'blue' },
    { name: 'Smart Solutions Company', badge: 'Basic', amount: '$99', tone: 'gray' },
    { name: 'Development Group', badge: 'Pro', amount: '$499', tone: 'blue' },
    { name: 'Future Company', badge: 'Enterprise', amount: '$2,000', tone: 'gold' },
  ]

  return (
    <div className={`mock ${compact ? 'mock--compact' : ''}`} aria-hidden="true">
      {/* Sidebar */}
      <aside className="mock__side">
        <div className="mock__side-logo">
          <LogoMark size={16} />
          <span>WORK FLOW</span>
        </div>
        {menu.map((g: any) => (
          <div key={g.section} className="mock__menu-group">
            <div className="mock__menu-title">{g.section}</div>
            {g.items.map((it: any) => (
              <div key={it.label} className={`mock__menu-item ${it.active ? 'is-active' : ''}`}>
                <i />
                {it.label}
              </div>
            ))}
          </div>
        ))}
      </aside>

      {/* Main area */}
      <div className="mock__main">
        <div className="mock__topbar">
          <div className="mock__search">{d.search}</div>
          <div className="mock__top-actions">
            <i /> <i /> <i />
            <div className="mock__avatar">
              <span>{d.admin}</span>
              <b />
            </div>
          </div>
        </div>

        <div className="mock__body">
          <div className="mock__heading">
            <h4>{d.title}</h4>
            <p>{d.subtitle}</p>
          </div>

          <div className="mock__grid">
            <div className="mock__col">
              {/* Stat cards */}
              <div className="mock__stats">
                <div className="mock__stat">
                  <span className="mock__stat-label">{d.mrr}</span>
                  <b>$67,000</b>
                  <small>{d.mrrNote}</small>
                  <em className="up">+15.3%</em>
                </div>
                <div className="mock__stat">
                  <span className="mock__stat-label">{d.activeCompanies}</span>
                  <b>124 / 132</b>
                  <small>{d.engagement}</small>
                  <em className="up">{d.thisMonth}</em>
                </div>
                <div className="mock__stat">
                  <span className="mock__stat-label">{d.unpaid}</span>
                  <b>$12,450</b>
                  <small>{d.followUp}</small>
                  <em className="down">{d.overdue}</em>
                </div>
                <div className="mock__stat">
                  <span className="mock__stat-label">{d.pending}</span>
                  <b>37</b>
                  <small>{d.needsProcessing}</small>
                </div>
              </div>

              {/* Cash flow chart */}
              <div className="mock__card">
                <div className="mock__card-head">
                  <span>{d.cashFlow}</span>
                  <span className="mock__legend">
                    <i className="dot dot--green" /> {d.revenue}
                    <i className="dot dot--blue" /> {d.expenses}
                  </span>
                </div>
                <div className="mock__bars">
                  {bars.map((h, i) => (
                    <div key={i} className="mock__bar" style={{ height: `${h}%` }} />
                  ))}
                </div>
              </div>

              <div className="mock__row">
                <div className="mock__card mock__card--half">
                  <div className="mock__card-head">
                    <span>{d.growth}</span>
                  </div>
                  <div className="mock__bars mock__bars--red">
                    {growthBars.map((h, i) => (
                      <div key={i} className="mock__bar" style={{ height: `${h}%` }} />
                    ))}
                  </div>
                </div>
                <div className="mock__card mock__card--half">
                  <div className="mock__card-head">
                    <span>{d.packages}</span>
                  </div>
                  <div className="mock__donut">
                    <div className="mock__donut-ring" />
                  </div>
                </div>
              </div>
            </div>

            {/* Right column */}
            <div className="mock__col mock__col--side">
              <div className="mock__card">
                <div className="mock__card-head">
                  <span>{d.latestCompanies}</span>
                  <a>{d.showAll}</a>
                </div>
                {companies.map((c: any) => (
                  <div key={c.name} className="mock__list-item">
                    <i className="mock__list-icon" />
                    <div className="mock__list-text">
                      <b>{c.name}</b>
                      <small>2026-06-01</small>
                    </div>
                    <span className={`mock__badge mock__badge--${c.tone}`}>{c.badge}</span>
                    <b className="mock__amount">{c.amount}</b>
                  </div>
                ))}
              </div>
              <div className="mock__card">
                <div className="mock__card-head">
                  <span>{d.latestRequests}</span>
                  <a>{d.showAll}</a>
                </div>
                {['#REQ-1247', '#REQ-1246'].map((r, i) => (
                  <div key={r} className="mock__list-item">
                    <div className="mock__list-text">
                      <b>
                        <span className="mock__req">{r}</span> {i === 0 ? 'Advanced Tech Company' : 'Innovation Institute'}
                      </b>
                      <small>2026-06-05</small>
                    </div>
                    <span className="mock__badge mock__badge--proc">{d.processing}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
