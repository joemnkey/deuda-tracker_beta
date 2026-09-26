import { useEffect, useMemo, useState } from 'react'

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

const FIXED_EXPENSES = [
  'Luz', 'Agua y Basura', 'Internet', 'Subscripciones', 'Prestamos pequeños',
  'Tarjeta Credito', 'Gasolina', 'Panapass', 'Supermercado', 'Max',
  'Ahorros', 'Inversiones',
]

const COLORS = ['#5b5ce2', '#27ae8a', '#ef9a3c', '#e55d80', '#438ee8', '#a06cd5', '#e7c84b', '#32a7a1', '#ef6c5b', '#7986cb', '#51a56f', '#c572aa', '#708090', '#df8e3d']

const toAmount = (value) => Number(value) || 0
const money = new Intl.NumberFormat('es-PA', { style: 'currency', currency: 'USD' })

function initialExpenses() {
  return FIXED_EXPENSES.map((name, index) => ({
    id: `fixed-${index}`,
    name,
    amounts: Object.fromEntries(MONTHS.map((month) => [month, ''])),
    periods: Object.fromEntries(MONTHS.map((month) => [month, 'first'])),
  }))
}

function App() {
  const [activeTab, setActiveTab] = useState('presupuesto')
  const [month, setMonth] = useState(MONTHS[new Date().getMonth()])
  const [incomes, setIncomes] = useState({})
  const [expenses, setExpenses] = useState(initialExpenses)

  useEffect(() => {
    const stored = localStorage.getItem('mi-presupuesto-v1')
    if (!stored) return
    try {
      const data = JSON.parse(stored)
      if (data.incomes) setIncomes(data.incomes)
      if (Array.isArray(data.expenses)) setExpenses(data.expenses)
    } catch { /* Ignore invalid local data. */ }
  }, [])

  useEffect(() => {
    localStorage.setItem('mi-presupuesto-v1', JSON.stringify({ incomes, expenses }))
  }, [incomes, expenses])

  const income = incomes[month] || { first: '', second: '' }
  const updateIncome = (period, value) => setIncomes((all) => ({
    ...all,
    [month]: { ...income, [period]: value },
  }))

  const current = useMemo(() => expenses.map((item, index) => ({
    ...item,
    amount: toAmount(item.amounts?.[month]),
    period: item.periods?.[month] || 'first',
    color: COLORS[index % COLORS.length],
  })), [expenses, month])

  const totals = useMemo(() => {
    const totalIncome = toAmount(income.first) + toAmount(income.second)
    const expenseTotal = current.reduce((sum, item) => sum + item.amount, 0)
    const first = current.filter((item) => item.period === 'first')
    const second = current.filter((item) => item.period === 'second')
    return {
      totalIncome, expenseTotal, balance: totalIncome - expenseTotal,
      firstTotal: first.reduce((sum, item) => sum + item.amount, 0), firstCount: first.filter((item) => item.amount > 0).length,
      secondTotal: second.reduce((sum, item) => sum + item.amount, 0), secondCount: second.filter((item) => item.amount > 0).length,
    }
  }, [income, current])

  const updateExpense = (id, field, value) => {
    setExpenses((items) => items.map((item) => {
      if (item.id !== id) return item
      if (field === 'name') return { ...item, name: value }
      if (field === 'amount') return { ...item, amounts: { ...item.amounts, [month]: value } }
      return { ...item, periods: { ...item.periods, [month]: value } }
    }))
  }

  const addExpense = () => {
    const id = `custom-${Date.now()}`
    setExpenses((items) => [...items, {
      id, name: 'Nuevo gasto',
      amounts: Object.fromEntries(MONTHS.map((m) => [m, ''])),
      periods: Object.fromEntries(MONTHS.map((m) => [m, 'first'])),
    }])
  }

  const removeExpense = (id) => setExpenses((items) => items.filter((item) => item.id !== id))

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand"><span className="brand-mark">$</span><span>Mi presupuesto</span></div>
        <div className="month-picker">
          <span>Mes</span>
          <select value={month} onChange={(e) => setMonth(e.target.value)} aria-label="Seleccionar mes">
            {MONTHS.map((item) => <option key={item}>{item}</option>)}
          </select>
        </div>
      </header>

      <section className="hero">
        <div><p className="eyebrow">RESUMEN DE {month.toUpperCase()}</p><h1>Tu dinero, con claridad.</h1><p className="hero-copy">Organiza tus gastos, decide qué pagar en cada quincena y mantén tu balance bajo control.</p></div>
        <div className="income-box">
          <span>Ingreso mensual</span><strong>{money.format(totals.totalIncome)}</strong><small>Primera + segunda quincena</small>
        </div>
      </section>

      <nav className="tabs" aria-label="Secciones"><button className={activeTab === 'presupuesto' ? 'active' : ''} onClick={() => setActiveTab('presupuesto')}>Presupuesto</button><button className={activeTab === 'grafica' ? 'active' : ''} onClick={() => setActiveTab('grafica')}>Distribución</button></nav>

      {activeTab === 'presupuesto' ? <>
        <section className="income-grid">
          <div className="section-title"><div><p className="eyebrow">INGRESOS</p><h2>¿Cuánto cobras?</h2></div><span className="muted">Registra lo que recibes por quincena</span></div>
          <label className="input-card"><span>Primera quincena <small>1 al 15</small></span><div className="currency-input"><i>$</i><input inputMode="decimal" type="number" min="0" placeholder="0.00" value={income.first} onChange={(e) => updateIncome('first', e.target.value)}/></div></label>
          <label className="input-card"><span>Segunda quincena <small>16 al 30</small></span><div className="currency-input"><i>$</i><input inputMode="decimal" type="number" min="0" placeholder="0.00" value={income.second} onChange={(e) => updateIncome('second', e.target.value)}/></div></label>
        </section>

        <section className="expenses-section">
          <div className="section-title"><div><p className="eyebrow">GASTOS</p><h2>Plan del mes</h2></div><button className="add-button" onClick={addExpense}>+ Agregar gasto</button></div>
          <div className="expense-list">
            <div className="expense-head"><span>Concepto</span><span>Monto</span><span>Quincena de pago</span><span></span></div>
            {current.map((item) => <div className="expense-row" key={item.id}>
              <label className="expense-name"><span className="color-dot" style={{ backgroundColor: item.color }}></span><input value={item.name} aria-label="Nombre del gasto" onChange={(e) => updateExpense(item.id, 'name', e.target.value)} /></label>
              <label className="amount-input"><span>$</span><input inputMode="decimal" type="number" min="0" placeholder="0.00" value={item.amounts[month]} aria-label={`Monto para ${item.name}`} onChange={(e) => updateExpense(item.id, 'amount', e.target.value)} /></label>
              <select value={item.period} onChange={(e) => updateExpense(item.id, 'period', e.target.value)} aria-label={`Quincena para ${item.name}`}><option value="first">1 al 15</option><option value="second">16 al 30</option></select>
              <button className="remove" onClick={() => removeExpense(item.id)} aria-label={`Eliminar ${item.name}`}>×</button>
            </div>)}
          </div>
        </section>

        <section className="summary-grid">
          <SummaryCard title="Primera quincena" subtitle="1 al 15" total={totals.firstTotal} count={totals.firstCount} tone="violet" />
          <SummaryCard title="Segunda quincena" subtitle="16 al 30" total={totals.secondTotal} count={totals.secondCount} tone="blue" />
          <div className="balance-card"><span>Balance estimado</span><strong className={totals.balance < 0 ? 'negative' : ''}>{money.format(totals.balance)}</strong><small>Ingreso mensual − gastos</small></div>
        </section>
      </> : <Distribution current={current} totals={totals} month={month} />}
    </main>
  )
}

function SummaryCard({ title, subtitle, total, count, tone }) {
  return <div className={`summary-card ${tone}`}><div><span>{title}</span><small>{subtitle}</small></div><strong>{money.format(total)}</strong><p>{count} {count === 1 ? 'gasto programado' : 'gastos programados'}</p></div>
}

function Distribution({ current, totals, month }) {
  const entries = current.filter((item) => item.amount > 0)
  const segments = entries.length ? entries : [{ name: 'Sin gastos', amount: 1, color: '#dce3ee' }]
  let angle = 0
  const gradient = segments.map((item) => {
    const start = angle
    angle += (item.amount / segments.reduce((sum, entry) => sum + entry.amount, 0)) * 360
    return `${item.color} ${start}deg ${angle}deg`
  }).join(', ')
  return <section className="distribution-page"><div className="section-title"><div><p className="eyebrow">DISTRIBUCIÓN</p><h2>¿A dónde va tu dinero?</h2><p className="muted">Gastos registrados en {month}</p></div><div className="chart-total"><span>Total gastado</span><strong>{money.format(totals.expenseTotal)}</strong></div></div>
    <div className="chart-layout"><div className="donut" style={{ background: `conic-gradient(${gradient})` }}><div><span>Disponible</span><strong>{money.format(totals.balance)}</strong></div></div><div className="legend">{entries.length ? entries.map((item) => <div className="legend-item" key={item.id}><span className="color-dot" style={{ backgroundColor: item.color }}></span><span>{item.name}</span><strong>{money.format(item.amount)}</strong></div>) : <p className="empty">Agrega montos a tus gastos para ver la gráfica.</p>}</div></div>
  </section>
}

export default App
