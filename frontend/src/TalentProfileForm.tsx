import { useState } from 'react'

const API = import.meta.env.VITE_API_URL || 'http://localhost:5220'

export default function TalentProfileForm({ onSaved }: { onSaved: () => void }) {
  const [sport, setSport] = useState('Football')
  const [position, setPosition] = useState('Striker')
  const [province, setProvince] = useState('Lusaka')
  const [msg, setMsg] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMsg('')
    const token = localStorage.getItem('zambezi-token') || ''
    try {
      const res = await fetch(`${API}/api/Talent/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ sport, position, province }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setMsg(`❌ ${data?.message || res.statusText || 'Failed'}`)
        return
      }
      setMsg(`✅ Saved! ${data.fullName} — ${data.sport} / ${data.position} / ${data.province}`)
      onSaved()
    } catch {
      setMsg('❌ Network error — is API running?')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ background: '#FFF8E7', padding: 16, borderRadius: 16, marginBottom: 16, border: '1px solid #FDE68A' }}>
      <h3 style={{ margin: '0 0 12px' }}>⚽ Edit My Profile</h3>
      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <label>Sport
          <select value={sport} onChange={e => setSport(e.target.value)} style={{ width: '100%', padding: 10, borderRadius: 10, border: '1px solid #FDE68A' }}>
            <option>Football</option>
            <option>Netball</option>
            <option>Basketball</option>
            <option>Athletics</option>
            <option>Rugby</option>
          </select>
        </label>
        <label>Position
          <select value={position} onChange={e => setPosition(e.target.value)} style={{ width: '100%', padding: 10, borderRadius: 10, border: '1px solid #FDE68A' }}>
            <option>Striker</option>
            <option>Midfielder</option>
            <option>Defender</option>
            <option>Goalkeeper</option>
            <option>Winger</option>
          </select>
        </label>
        <label>Province
          <select value={province} onChange={e => setProvince(e.target.value)} style={{ width: '100%', padding: 10, borderRadius: 10, border: '1px solid #FDE68A' }}>
            <option>Lusaka</option>
            <option>Copperbelt</option>
            <option>Central</option>
            <option>Eastern</option>
            <option>Western</option>
            <option>Northern</option>
            <option>North-Western</option>
            <option>Southern</option>
            <option>Luapula</option>
            <option>Muchinga</option>
          </select>
        </label>
        <button type="submit" disabled={saving} style={{ background: '#1a7a2e', color: 'white', border: 'none', padding: 12, borderRadius: 10, fontWeight: 700, cursor: 'pointer' }}>
          {saving ? 'Saving...' : 'Save Profile'}
        </button>
        {msg && <p style={{ margin: 0, fontSize: 13 }}>{msg}</p>}
      </form>
    </div>
  )
}