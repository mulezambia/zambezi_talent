import { useState, useEffect } from 'react'
import './App.css'

type User = { id: string, fullName: string, email: string, role: string, position?: string, age?: number, location?: string, province?: string, isVerified?: boolean }
type Talent = { id: string, fullName: string, position: string, age: number, location: string, email: string, province?: string }
type ContactRequest = { id: number, scoutEmail: string, scoutName: string, scoutPhone?: string, talentEmail: string, talentName: string, status: string, message: string, createdAt: string }
type TrialInvite = { id: number, scoutEmail: string, scoutName: string, talentEmail: string, talentName: string, trialDate: string, trialTime: string, location: string, message: string, status: string, createdAt: string };
const API = import.meta.env.VITE_API_URL || 'http://localhost:5220'
const normalizeUser = (raw: any): User => ({ id: String(raw?.id ?? raw?.Id ?? ''), fullName: raw?.fullName ?? raw?.FullName ?? '', email: raw?.email ?? raw?.Email ?? '', role: raw?.role ?? raw?.Role ?? '', position: raw?.position ?? raw?.Position ?? '', age: raw?.age ?? raw?.Age ?? 0, location: raw?.location ?? raw?.Location ?? raw?.province ?? raw?.Province ?? 'Zambia', province: raw?.province ?? raw?.Province ?? raw?.location ?? raw?.Location ?? '', isVerified: raw?.isVerified ?? raw?.IsVerified ?? false })
const normalizeRequest = (r: any): ContactRequest => { const rawStatus = r?.status ?? r?.Status ?? 'Pending'; const status = rawStatus.charAt(0).toUpperCase() + rawStatus.slice(1).toLowerCase(); return { id: r?.id ?? r?.Id ?? 0, scoutEmail: r?.scoutEmail ?? r?.ScoutEmail ?? '', scoutName: r?.scoutName ?? r?.ScoutName ?? '', scoutPhone: r?.scoutPhone ?? r?.ScoutPhone ?? '', talentEmail: r?.talentEmail ?? r?.TalentEmail ?? '', talentName: r?.talentName ?? r?.TalentName ?? '', status, message: r?.message ?? r?.Message ?? '', createdAt: r?.createdAt ?? r?.CreatedAt ?? '' } };
const normalizeTrial = (t: any): TrialInvite => { const s = (t?.status ?? t?.Status ?? 'Pending'); return { id: t?.id ?? t?.Id ?? 0, scoutEmail: t?.scoutEmail ?? t?.ScoutEmail ?? '', scoutName: t?.scoutName ?? t?.ScoutName ?? '', talentEmail: t?.talentEmail ?? t?.TalentEmail ?? '', talentName: t?.talentName ?? t?.TalentName ?? '', trialDate: t?.trialDate ?? t?.TrialDate ?? '', trialTime: t?.trialTime ?? t?.TrialTime ?? '', location: t?.location ?? t?.Location ?? '', message: t?.message ?? t?.Message ?? '', status: s.charAt(0).toUpperCase() + s.slice(1).toLowerCase(), createdAt: t?.createdAt ?? t?.CreatedAt ?? '' } };
const toWhatsAppLink = (phone: string) => { if (!phone) return ''; let cleaned = phone.replace(/[^0-9+]/g, ''); if (cleaned.startsWith('+')) cleaned = cleaned.slice(1); else if (cleaned.startsWith('0')) cleaned = '260' + cleaned.slice(1); return `https://wa.me/${cleaned}` };
const copyToClipboard = async (text: string) => { try { await navigator.clipboard.writeText(text); alert(`📋 Copied: ${text}`) } catch { alert(text) } };
const getPhoto = (id: string) => { const saved = localStorage.getItem(`photo-${id}`); if (saved) return saved; let hash = 0; for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) % 1000; return `https://i.pravatar.cc/150?img=${(hash % 70) + 1}` };
const getVideo = (id: string) => localStorage.getItem(`video-${id}`) || ''
const getYouTubeEmbed = (url: string) => { if (!url) return ''; let id = ''; if (url.includes('youtu.be/')) id = url.split('youtu.be/')[1].split('?')[0].split('&')[0]; else if (url.includes('v=')) id = url.split('v=')[1].split('&')[0]; else if (url.includes('/shorts/')) id = url.split('/shorts/')[1].split('?')[0].split('/')[0]; else if (url.includes('/embed/')) id = url.split('/embed/')[1].split('?')[0]; else return ''; return `https://www.youtube.com/embed/${id}` };
const openVideoDB = () => new Promise<any>((resolve, reject) => { const req = indexedDB.open('zambezi-videos', 1); req.onupgradeneeded = () => { if (!req.result.objectStoreNames.contains('videos')) req.result.createObjectStore('videos') }; req.onsuccess = () => resolve(req.result); req.onerror = () => reject(req.error) })
const saveVideoBlob = async (userId: string, file: File | Blob, index: number) => { const db = await openVideoDB(); return new Promise<void>((res, rej) => { const tx = db.transaction('videos', 'readwrite'); tx.objectStore('videos').put(file, `${userId}-${index}`); tx.oncomplete = () => res(); tx.onerror = () => rej(tx.error) }) };
const getVideoBlobUrl = async (userId: string, index: number) => { const db = await openVideoDB(); return new Promise<string>((res) => { const tx = db.transaction('videos', 'readonly'); const req = tx.objectStore('videos').get(`${userId}-${index}`); req.onsuccess = () => { if (req.result) res(URL.createObjectURL(req.result as Blob)); else res('') }; req.onerror = () => res('') }) };
const getVideoBlob = async (userId: string, index: number) => { const db = await openVideoDB(); return new Promise<Blob | null>((res) => { const tx = db.transaction('videos', 'readonly'); const req = tx.objectStore('videos').get(`${userId}-${index}`); req.onsuccess = () => res(req.result || null); req.onerror = () => res(null) }) };
const getAllVideoBlobUrls = async (userId: string) => { const urls: string[] = []; for (let i = 0; i < 5; i++) { const url = await getVideoBlobUrl(userId, i); if (url) urls.push(url) }; return urls };
const deleteAndShift = async (userId: string, deleteIndex: number) => { const blobs: Blob[] = []; for (let i = 0; i < 5; i++) { const b = await getVideoBlob(userId, i); if (b) blobs.push(b) }; const remaining = blobs.filter((_, i) => i !== deleteIndex); const db = await openVideoDB(); await new Promise<void>((res) => { const tx = db.transaction('videos', 'readwrite'); for (let i = 0; i < 5; i++) tx.objectStore('videos').delete(`${userId}-${i}`); tx.oncomplete = () => res() }); for (let i = 0; i < remaining.length; i++) await saveVideoBlob(userId, remaining[i], i) }

export default function App() {
  const [user, setUser] = useState<User | null>(() => { const saved = localStorage.getItem('zambezi-user'); if (!saved) return null; try { return normalizeUser(JSON.parse(saved)) } catch { return null } })
  const [talents, setTalents] = useState<Talent[]>([])
  const [shortlist, setShortlist] = useState<string[]>([])
  const [selectedTalent, setSelectedTalent] = useState<Talent | null>(null);
  const [contactRequests, setContactRequests] = useState<ContactRequest[]>([])
  const [mySentRequests, setMySentRequests] = useState<ContactRequest[]>([])
  const [trialInvites, setTrialInvites] = useState<TrialInvite[]>([])
  const [mySentTrials, setMySentTrials] = useState<TrialInvite[]>([])
  const [verifiedMap, setVerifiedMap] = useState<Record<string, boolean>>({})
  const [allUsers, setAllUsers] = useState<User[]>([])
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [view, setView] = useState<'all' | 'shortlist'>('all')
  const [search, setSearch] = useState('')
  const [filterPos, setFilterPos] = useState('All')
  const [refreshKey, setRefreshKey] = useState(0)
  const [videoInput, setVideoInput] = useState('')
  const [uploading, setUploading] = useState(false)
  const [myClipUrls, setMyClipUrls] = useState<string[]>([])
  const [clipUrls, setClipUrls] = useState<Record<string, string[]>>({})
  const [form, setForm] = useState({ fullName: '', email: '', password: '', role: 'Talent', position: '', age: '', location: '' })

  useEffect(() => { fetch(`${API}/api/users`).then(r => r.json()).then((data: any[]) => { const list = Array.isArray(data) ? data : []; const normalized = list.map(normalizeUser).filter(u => (u.role || '').toLowerCase() === 'talent').map(u => ({ id: u.id, fullName: u.fullName, email: u.email, position: u.position || '', age: u.age || 0, location: u.location || 'Zambia', province: u.province || '' })); setTalents(normalized); const vMap: Record<string, boolean> = {}; list.forEach((u: any) => { const em = (u?.email ?? u?.Email ?? '').toLowerCase(); if (em) vMap[em] = !!(u?.isVerified ?? u?.IsVerified ?? false) }); setVerifiedMap(vMap); setAllUsers(list.map(normalizeUser)) }).catch(() => {}) }, [user, refreshKey])
  useEffect(() => {
    if (user?.role === 'Scout') { fetch(`${API}/api/shortlist/${user.id}`).then(r => r.json()).then((d: any[]) => setShortlist(Array.isArray(d) ? d.map((x: any) => String(x.talentId ?? x.TalentId ?? '')) : [])).catch(() => {}); if (user.email) { fetch(`${API}/api/contactrequests/for-scout?email=${encodeURIComponent(user.email)}`).then(r => r.json()).then((d: any[]) => setMySentRequests(Array.isArray(d) ? d.map(normalizeRequest) : [])).catch(() => {}); fetch(`${API}/api/trialinvites/for-scout?email=${encodeURIComponent(user.email)}`).then(r => r.json()).then((d: any[]) => setMySentTrials(Array.isArray(d) ? d.map(normalizeTrial) : [])).catch(() => {}) } }
    if (user?.role === 'Talent' && user.email) { fetch(`${API}/api/contactrequests/for-talent?email=${encodeURIComponent(user.email)}`).then(r => r.json()).then((d: any[]) => setContactRequests(Array.isArray(d) ? d.map(normalizeRequest) : [])).catch(() => {}); fetch(`${API}/api/trialinvites/for-talent?email=${encodeURIComponent(user.email)}`).then(r => r.json()).then((d: any[]) => setTrialInvites(Array.isArray(d) ? d.map(normalizeTrial) : [])).catch(() => {}) }
    if (user) { setVideoInput(getVideo(user.id)); getAllVideoBlobUrls(user.id).then(setMyClipUrls) }
  }, [user, refreshKey])
  useEffect(() => { talents.forEach(async (t) => { const urls = await getAllVideoBlobUrls(t.id); if (urls.length) setClipUrls(prev => ({ ...prev, [t.id]: urls })) }) }, [talents])

  const handleAuth = async (e: any) => { e.preventDefault(); const url = mode === 'login' ? `${API}/api/auth/login` : `${API}/api/auth/register`; const body = mode === 'login' ? { email: form.email, password: form.password } : { fullName: form.fullName, email: form.email, password: form.password, role: form.role, position: form.position, age: Number(form.age) || 0, location: form.location, province: form.location }; const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); const data = await res.json(); if (res.ok) { const loggedUser = normalizeUser(data.user || data); setUser(loggedUser); localStorage.setItem('zambezi-user', JSON.stringify(loggedUser)); if (data.token || data.Token) localStorage.setItem('zambezi-token', data.token || data.Token); if (mode === 'register') alert('Registered! Now login.') } else alert(data.message || data.title || 'Error') };
  const handleLogout = () => { localStorage.removeItem('zambezi-user'); localStorage.removeItem('zambezi-token'); setUser(null) };
  const toggleShortlist = async (talentId: string) => { if (!user) return; const isIn = shortlist.includes(talentId); const res = await fetch(`${API}/api/shortlist`, { method: isIn ? 'DELETE' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ scoutId: user.id, talentId }) }); if (res.ok) setShortlist(isIn ? shortlist.filter(id => id !== talentId) : [...shortlist, talentId]) };
  const sendContactRequest = async (talent: Talent) => { if (!user) return; if (!user.email) { alert('Please logout and login again'); return }; const phone = prompt('Enter your WhatsApp number so the talent can reach you (optional, e.g 0977 123 456):', '') || ''; const res = await fetch(`${API}/api/contactrequests`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ scoutEmail: user.email, scoutName: user.fullName, scoutPhone: phone, talentEmail: talent.email, talentName: talent.fullName, message: `Hi ${talent.fullName}, I am a scout and I liked your profile.` }) }); if (res.ok) alert('📩 Contact request sent! Talent will accept or decline.'); else { const t = await res.text(); alert(t.toLowerCase().includes('already') ? 'Already requested - check status on card' : t) }; setRefreshKey(k => k + 1) };
  const respondRequest = async (id: number, status: string) => { await fetch(`${API}/api/contactrequests/${id}/respond`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(status) }); setRefreshKey(k => k + 1) };
  const getRequestForTalent = (talentEmail: string) => { const matches = mySentRequests.filter(r => (r.talentEmail || '').toLowerCase() === (talentEmail || '').toLowerCase()); if (!matches.length) return undefined; return matches.find(r => r.status === 'Pending') || matches[matches.length - 1] }

  const toggleVerify = async (id: string, isVerified: boolean) => {
    const endpoint = isVerified ? 'unverify' : 'verify'
    const token = localStorage.getItem('zambezi-token') || ''
    const res = await fetch(`${API}/api/users/${id}/${endpoint}`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } })
    if (res.status === 401 || res.status === 403) { alert('⛔ Only Admin can do this'); return }
    setRefreshKey(k => k + 1)
    alert(isVerified ? '⚠️ Scout unverified' : '✅ Scout verified!')
  }

  const sendTrialInvite = async (talent: Talent) => {
    if (!user) return
    const date = prompt('📅 Trial Date (e.g 2026-11-15):', '2026-11-15')
    if (!date) return
    const time = prompt('🕙 Trial Time (e.g 10:00):', '10:00')
    if (!time) return
    const location = prompt('📍 Trial Location (e.g Heroes Stadium, Lusaka):', 'Heroes Stadium, Lusaka')
    if (!location) return
    const message = prompt('💬 Message to talent (optional):', `Hi ${talent.fullName}, you are invited for a trial. Please bring boots & ID.`) || ''
    const res = await fetch(`${API}/api/trialinvites`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ scoutEmail: user.email, scoutName: user.fullName, talentEmail: talent.email, talentName: talent.fullName, trialDate: date, trialTime: time, location, message }) })
    if (res.ok) alert('📅 Trial invite sent!')
    else { const t = await res.text(); alert(t) }
    setRefreshKey(k => k + 1)
  };
  const respondTrial = async (id: number, status: string) => {
    if (status === 'Accepted') {
      const ok = confirm('🛡️ SAFETY CHECK:\n\n• Never send money for a trial\n• Never send MoMo / Airtel Money to a scout\n• Real trials are FREE\n• Meet in public, bring a parent/guardian\n\nDo you still want to ACCEPT this trial?')
      if (!ok) return
    }
    await fetch(`${API}/api/trialinvites/${id}/respond`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(status) }); setRefreshKey(k => k + 1)
  };
  const getTrialForTalent = (talentEmail: string) => { const matches = mySentTrials.filter(t => (t.talentEmail || '').toLowerCase() === (talentEmail || '').toLowerCase()); if (!matches.length) return undefined; return matches.find(t => t.status === 'Pending') || matches[matches.length - 1] };
  const handlePhotoUpload = (e: any) => { const file = e.target.files[0]; if (!file || !user) return; const reader = new FileReader(); reader.onload = () => { localStorage.setItem(`photo-${user.id}`, reader.result as string); setRefreshKey(k => k + 1); alert('✅ Photo saved!') }; reader.readAsDataURL(file) };
  const handleSaveVideo = () => { if (!user) return; if (!videoInput.includes('youtube.com') && !videoInput.includes('youtu.be')) { alert('Please paste a valid YouTube link'); return }; localStorage.setItem(`video-${user.id}`, videoInput); setRefreshKey(k => k + 1); alert('✅ Highlights saved!') };
  const handleClipUpload = (e: any) => { const file = e.target.files[0]; if (!file || !user) return; if (!file.type.startsWith('video/')) { alert('Please pick a video file'); return }; if (myClipUrls.length >= 5) { alert('❌ You already have 5 clips.'); return }; const tempUrl = URL.createObjectURL(file); const vid = document.createElement('video'); vid.preload = 'metadata'; vid.onloadedmetadata = async () => { URL.revokeObjectURL(tempUrl); const duration = vid.duration; if (duration > 100) { alert(`❌ Video is ${Math.round(duration)}s — max is 100 seconds.`); return }; setUploading(true); await saveVideoBlob(user.id, file, myClipUrls.length); setUploading(false); const newUrls = await getAllVideoBlobUrls(user.id); setMyClipUrls(newUrls); setRefreshKey(k => k + 1); alert(`✅ Clip ${newUrls.length}/5 saved!`) }; vid.src = tempUrl; e.target.value = '' };
  const handleDeleteClip = async (index: number) => { if (!user) return; if (!confirm(`Delete Clip ${index + 1}?`)) return; await deleteAndShift(user.id, index); const newUrls = await getAllVideoBlobUrls(user.id); setMyClipUrls(newUrls); setRefreshKey(k => k + 1) }

  if (!user) return (<div className="app-container"><div className="auth-box"><h1>Zambezi <span>Talent</span> <span className="ball">⚽</span></h1><p style={{color:'#aaa'}}>Find Zambia's Next Star</p><form onSubmit={handleAuth}>{mode === 'register' && <><input placeholder="Full Name" value={form.fullName} onChange={e => setForm({...form, fullName: e.target.value})} /><select value={form.role} onChange={e => setForm({...form, role: e.target.value})}><option>Talent</option><option>Scout</option><option>Admin</option></select><input placeholder="Position (e.g Striker)" value={form.position} onChange={e => setForm({...form, position: e.target.value})} /><input placeholder="Age" value={form.age} onChange={e => setForm({...form, age: e.target.value})} /><input placeholder="Location (e.g Lusaka)" value={form.location} onChange={e => setForm({...form, location: e.target.value})} /></>}<input placeholder="Email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} /><input type="password" placeholder="Password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} /><button className="btn btn-primary" type="submit">{mode === 'login' ? 'Login' : 'Register'}</button></form><button className="btn btn-secondary" style={{marginTop:10}} onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>{mode === 'login' ? 'Need account? Register' : 'Have account? Login'}</button></div></div>)

  const filtered = talents.filter(t => (view === 'shortlist' ? shortlist.includes(t.id) : true) && t.fullName.toLowerCase().includes(search.toLowerCase()) && (filterPos === 'All' || t.position === filterPos))
  const pendingRequests = contactRequests.filter(r => r.status === 'Pending')
  const pendingTrials = trialInvites.filter(t => t.status === 'Pending')

  // --- TALENT PROFILE PAGE ---
  if (selectedTalent) {
    const t: Talent = selectedTalent;
    const isShort = shortlist.includes(t.id);
    const clips = clipUrls[t.id] || [];
    const embed = getYouTubeEmbed(getVideo(t.id));
    const req = getRequestForTalent(t.email);
    const trial = getTrialForTalent(t.email);
    const isVerifiedTalent = verifiedMap[(t.email || '').toLowerCase()];
    return (
      <div className="app-container">
        <button className="btn btn-secondary" onClick={() => setSelectedTalent(null)}>← Back to Talents</button>
        <div style={{ background: '#FFF8E7', padding: 20, borderRadius: 16, marginTop: 16, boxShadow: '0 4px 12px rgba(0,0,0,0.08)', border: '1px solid #FDE68A' }}>
          <div style={{ textAlign: 'center' }}>
            <img className="avatar-img" src={getPhoto(t.id)} alt={t.fullName} style={{ width: 120, height: 120, borderRadius: '50%', objectFit: 'cover', border: '3px solid white', boxShadow: '0 2px 10px rgba(0,0,0,0.15)' }} />
            <h1 style={{ margin: '12px 0 4px' }}>{t.fullName} {isVerifiedTalent ? '✅' : ''}</h1>
            <p style={{ color: '#666', margin: 0 }}>{t.position} • {t.age} yrs • 📍 {t.location}</p>
            <p style={{ color: '#666', fontSize: 13 }}>{t.province ? `Province: ${t.province} • ` : ''}{t.email}</p>
          </div>
          <hr style={{ borderColor: '#FDE68A' }} />
          <p><b>Position:</b> {t.position}</p>
          <p><b>Age:</b> {t.age}</p>
          <p><b>Location:</b> {t.location}</p>
          <p><b>Province:</b> {t.province || 'N/A'}</p>
          <h3>🎥 Highlights</h3>
          {clips.length ? clips.map((url, i) => (<video key={i} style={{ width: '100%', height: 220, borderRadius: 12, background: 'black', marginBottom: 10 }} src={url} controls playsInline />)) : embed ? <iframe style={{ width: '100%', height: 220, borderRadius: 12, border: 'none' }} src={embed} allowFullScreen title={t.fullName}></iframe> : <p style={{ color: '#999' }}>🎥 No highlights yet</p>}
          {user.role === 'Scout' && (
            <>
              <button className={`btn ${isShort ? 'btn-shortlisted' : 'btn-shortlist'}`} onClick={() => toggleShortlist(t.id)} style={{ width: '100%', marginTop: 12 }}>{isShort ? '⭐ Shortlisted - Tap to Remove' : '☆ Add to Shortlist'}</button>
              {!req && <button className="btn btn-primary" style={{ marginTop: 8, width: '100%' }} onClick={() => sendContactRequest(t)}>📩 Request to Contact</button>}
              {req && req.status === 'Pending' && <button className="btn btn-secondary" style={{ marginTop: 8, width: '100%' }} disabled>⏳ Requested — Waiting</button>}
              {req && req.status === 'Accepted' && (
                <div style={{ marginTop: 12 }}>
                  <div style={{ background: '#dcfce7', padding: 12, borderRadius: 10, textAlign: 'center', marginBottom: 8 }}><b>✅ Accepted — Contact {t.fullName}</b><div style={{ fontSize: 12 }}>{t.email}</div><div style={{ display: 'flex', gap: 6, marginTop: 8 }}><a href={`mailto:${t.email}`} style={{ flex: 1, background: '#1a7a2e', color: 'white', padding: 9, borderRadius: 8, fontWeight: 700, fontSize: 12, textDecoration: 'none', textAlign: 'center' }}>📧 Email</a><button onClick={() => copyToClipboard(t.email)} style={{ flex: 1, background: 'white', border: '1px solid #ddd', padding: 9, borderRadius: 8, fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>📋 Copy</button></div></div>
                  {!trial && <button onClick={() => sendTrialInvite(t)} style={{ width: '100%', background: '#2563eb', color: 'white', border: 'none', padding: 12, borderRadius: 10, fontWeight: 700, cursor: 'pointer' }}>📅 Send Trial Invite</button>}
                  {trial && trial.status === 'Pending' && <div style={{ marginTop: 8, background: '#fef3c7', padding: 10, borderRadius: 8, fontSize: 12 }}><b>⏳ Trial Pending</b><div>📅 {trial.trialDate} at {trial.trialTime}</div><div>📍 {trial.location}</div></div>}
                  {trial && trial.status === 'Accepted' && <div style={{ marginTop: 8, background: '#dcfce7', padding: 10, borderRadius: 8, fontSize: 12, fontWeight: 700 }}>✅ Trial Accepted!<div>📅 {trial.trialDate} at {trial.trialTime}</div><div>📍 {trial.location}</div></div>}
                  {trial && trial.status === 'Declined' && <div style={{ marginTop: 8, background: '#fee2e2', padding: 10, borderRadius: 8, fontSize: 12 }}>❌ Trial Declined — <button onClick={() => sendTrialInvite(t)} style={{ background: 'none', border: 'none', color: '#2563eb', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}>Send Another?</button></div>}
                </div>
              )}
              {req && req.status === 'Declined' && <p style={{ textAlign: 'center', background: '#fee2e2', padding: 10, borderRadius: 10 }}>❌ Declined by Talent</p>}
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <div className="app-header"><h1>Zambezi <span>Talent</span> <span className="ball">⚽</span></h1><button className="btn btn-logout" onClick={handleLogout}>Logout</button></div>

      {user.role === 'Admin' && (
        <div style={{background:'#FFF8E7', padding:16, borderRadius:16, marginBottom:16, boxShadow:'0 4px 12px rgba(0,0,0,0.08)', border:'1px solid #FDE68A'}}>
          <h2 style={{margin:'0 0 4px'}}>👑 Admin Dashboard</h2>
          <p style={{margin:'0 0 12px', color:'#666', fontSize:13}}>Verify scouts so talents can trust them. Unverified scouts show ⚠️ warning.</p>
          <div style={{display:'flex', gap:10, marginBottom:12}}>
            <div style={{flex:1, background:'#eff6ff', padding:12, borderRadius:10, textAlign:'center'}}><b style={{fontSize:20}}>{allUsers.filter(u=>u.role==='Scout').length}</b><div style={{fontSize:12}}>Scouts</div></div>
            <div style={{flex:1, background:'#f0fdf4', padding:12, borderRadius:10, textAlign:'center'}}><b style={{fontSize:20}}>{allUsers.filter(u=>u.role==='Talent').length}</b><div style={{fontSize:12}}>Talents</div></div>
            <div style={{flex:1, background:'#fef3c7', padding:12, borderRadius:10, textAlign:'center'}}><b style={{fontSize:20}}>{allUsers.filter(u=>u.role==='Scout' && u.isVerified).length}</b><div style={{fontSize:12}}>Verified</div></div>
          </div>
          <h3 style={{margin:'12px 0 8px'}}>🔎 Scouts — Verify / Unverify</h3>
          {allUsers.filter(u=>u.role==='Scout').length === 0 && <p style={{color:'#999', fontSize:13}}>No scouts yet.</p>}
          {allUsers.filter(u=>u.role==='Scout').map(s => (
            <div key={s.id} style={{display:'flex', justifyContent:'space-between', alignItems:'center', border:'1px solid #FDE68A', borderRadius:12, padding:12, marginBottom:8, background:'white'}}>
              <div><b>{s.fullName} {s.isVerified ? <span style={{background:'#dcfce7', color:'#166534', fontSize:11, padding:'2px 6px', borderRadius:10}}>✅ Verified</span> : <span style={{background:'#fef3c7', color:'#92400e', fontSize:11, padding:'2px 6px', borderRadius:10}}>⚠️ Unverified</span>}</b><div style={{fontSize:12, color:'#666'}}>{s.email} • {s.province || s.location || 'Zambia'}</div></div>
              <button onClick={() => toggleVerify(s.id, !!s.isVerified)} style={{background: s.isVerified ? '#e5e7eb' : '#1a7a2e', color: s.isVerified ? '#111' : 'white', border:'none', padding:'10px 14px', borderRadius:10, fontWeight:700, cursor:'pointer', whiteSpace:'nowrap'}}>{s.isVerified ? '❌ Unverify' : '✅ Verify'}</button>
            </div>
          ))}
          <h3 style={{margin:'16px 0 8px'}}>⚽ All Users ({allUsers.length})</h3>
          {allUsers.map(u => (
            <div key={u.id} style={{display:'flex', justifyContent:'space-between', fontSize:13, borderBottom:'1px solid #FDE68A', padding:'8px 0'}}><span><b>{u.fullName}</b> — {u.email}</span><span>{u.role} {u.role==='Scout' && (u.isVerified ? '✅' : '⚠️')}</span></div>
          ))}
        </div>
      )}

      <div className={`profile-card ${user.role === 'Scout' ? 'scout' : 'talent'}`}><div style={{textAlign:'center'}}><img className="avatar-img" src={getPhoto(user.id)} alt={user.fullName} /><label style={{display:'block', marginTop:8, background:'rgba(255,255,255,0.25)', padding:'6px 10px', borderRadius:20, fontSize:12, cursor:'pointer', fontWeight:700}}>📷 Change Photo<input type="file" accept="image/*" onChange={handlePhotoUpload} style={{display:'none'}} /></label></div><div className="profile-info"><h2>{user.fullName} {user.role === 'Scout' && (verifiedMap[(user.email||'').toLowerCase()] || user.isVerified ? <span style={{background:'#dcfce7', color:'#166534', fontSize:12, padding:'2px 8px', borderRadius:10}}>✅ Verified Scout</span> : <span style={{background:'#fef3c7', color:'#92400e', fontSize:12, padding:'2px 8px', borderRadius:10}}>⚠️ Unverified</span>)}</h2><p>{user.email} • {user.location || user.province || 'Zambia'}</p><span className="badge">{user.role === 'Scout' ? `🔎 Scout • ${shortlist.length} Shortlisted` : user.role === 'Admin' ? '👑 Admin' : `⚽ ${user.position || 'Talent'} • ${user.age || ''} yrs`}</span></div></div>

      {user.role === 'Talent' && (
        <div style={{background:'#FFF8E7', padding:16, borderRadius:16, marginBottom:16, boxShadow:'0 4px 12px rgba(0,0,0,0.08)', border:'1px solid #FDE68A'}}>
          <h3 style={{margin:'0 0 4px'}}>📩 Contact Requests {pendingRequests.length > 0 && <span style={{background:'#e11d48', color:'white', fontSize:12, padding:'2px 8px', borderRadius:10}}>{pendingRequests.length} new</span>}</h3>
          <div style={{background:'#fef2f2', border:'1px solid #fecaca', padding:'10px', borderRadius:10, fontSize:12, marginBottom:10}}>🛡️ <b>SAFETY:</b> Zambezi Talent will NEVER ask you to pay for a trial. If a scout asks for money, Decline + Report. Real scouts are <b>✅ Verified</b>.</div>
          <p style={{margin:'0 0 12px', color:'#666', fontSize:13}}>Accept only if you trust them. Never send money for a trial.</p>
          {contactRequests.length === 0 && <p style={{color:'#999', fontSize:13, margin:0}}>No requests yet.</p>}
          {contactRequests.map(r => (<div key={r.id} style={{border:'1px solid #FDE68A', borderRadius:12, padding:12, marginBottom:8, background: r.status === 'Pending' ? '#fff7ed' : 'white'}}><div style={{display:'flex', justifyContent:'space-between'}}><div><b>{r.scoutName} {verifiedMap[(r.scoutEmail||'').toLowerCase()] ? <span style={{background:'#dcfce7', color:'#166534', fontSize:11, padding:'2px 6px', borderRadius:10}}>✅ Verified Scout</span> : <span style={{background:'#fef3c7', color:'#92400e', fontSize:11, padding:'2px 6px', borderRadius:10}}>⚠️ Unverified - Be Careful</span>}</b><div style={{fontSize:12, color:'#666'}}>{r.scoutEmail}{r.scoutPhone ? ` • 📱 ${r.scoutPhone}` : ''}</div><div style={{fontSize:12, color:'#666', marginTop:4}}>{r.message}</div></div><span style={{fontSize:11, fontWeight:700, padding:'3px 8px', borderRadius:10, background: r.status === 'Accepted' ? '#dcfce7' : r.status === 'Declined' ? '#fee2e2' : '#fef3c7'}}>{r.status}</span></div>{r.status === 'Pending' && (<div style={{display:'flex', gap:8, marginTop:10}}><button onClick={() => respondRequest(r.id, 'Accepted')} style={{flex:1, background:'#1a7a2e', color:'white', border:'none', padding:'10px', borderRadius:10, fontWeight:700, cursor:'pointer'}}>✅ Accept</button><button onClick={() => respondRequest(r.id, 'Declined')} style={{flex:1, background:'#e5e7eb', border:'none', padding:'10px', borderRadius:10, fontWeight:700, cursor:'pointer'}}>❌ Decline</button></div>)}{r.status === 'Accepted' && (<div style={{marginTop:12, background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:10, padding:12}}><b style={{fontSize:13}}>✅ You accepted — Contact {r.scoutName}:</b><div style={{display:'flex', gap:8, marginTop:8, flexWrap:'wrap'}}><a href={`mailto:${r.scoutEmail}?subject=Zambezi Talent - ${user.fullName}&body=Hi ${r.scoutName}, I accepted your contact request on Zambezi Talent.`} style={{flex:1, textAlign:'center', background:'#1a7a2e', color:'white', padding:'10px', borderRadius:10, fontWeight:700, fontSize:13, textDecoration:'none'}}>📧 Email Scout</a>{r.scoutPhone && <a href={toWhatsAppLink(r.scoutPhone)} target="_blank" rel="noreferrer" style={{flex:1, textAlign:'center', background:'#25D366', color:'white', padding:'10px', borderRadius:10, fontWeight:700, fontSize:13, textDecoration:'none'}}>📱 WhatsApp</a>}<button onClick={() => copyToClipboard(r.scoutEmail)} style={{flex:1, background:'white', border:'1px solid #ddd', padding:'10px', borderRadius:10, fontWeight:700, fontSize:13, cursor:'pointer'}}>📋 Copy Email</button></div><p style={{fontSize:11, color:'#666', margin:'8px 0 0'}}>Only contact on official numbers. Never send money for trials.</p></div>)}</div>))}
        </div>
      )}

      {user.role === 'Talent' && (
        <div style={{background:'#FFF8E7', padding:16, borderRadius:16, marginBottom:16, boxShadow:'0 4px 12px rgba(0,0,0,0.08)', border:'1px solid #FDE68A'}}>
          <h3 style={{margin:'0 0 4px'}}>📅 Trial Invites {pendingTrials.length > 0 && <span style={{background:'#2563eb', color:'white', fontSize:12, padding:'2px 8px', borderRadius:10}}>{pendingTrials.length} new</span>}</h3>
          <div style={{background:'#fef2f2', border:'1px solid #fecaca', padding:'10px', borderRadius:10, fontSize:12, marginBottom:10}}>🚨 <b>NEVER SEND MONEY.</b> No trial costs money. If they ask for transport / kit / registration fee, it's a SCAM. Decline immediately.</div>
          <p style={{margin:'0 0 12px', color:'#666', fontSize:13}}>Scouts can only invite you after you accepted their contact.</p>
          {trialInvites.length === 0 && <p style={{color:'#999', fontSize:13, margin:0}}>No trial invites yet.</p>}
          {trialInvites.map(t => (
            <div key={t.id} style={{border:'1px solid #FDE68A', borderRadius:12, padding:12, marginBottom:8, background: t.status === 'Pending' ? '#eff6ff' : 'white'}}>
              <div style={{display:'flex', justifyContent:'space-between'}}><div><b>📅 {t.trialDate} at {t.trialTime}</b><div style={{fontSize:13}}>📍 {t.location}</div><div style={{fontSize:12, color:'#666', marginTop:4}}>From: {t.scoutName} {verifiedMap[(t.scoutEmail||'').toLowerCase()] ? '✅ Verified' : '⚠️ Unverified'} ({t.scoutEmail})</div><div style={{fontSize:12, color:'#666'}}>{t.message}</div></div><span style={{fontSize:11, fontWeight:700, padding:'3px 8px', borderRadius:10, height:'fit-content', background: t.status === 'Accepted' ? '#dcfce7' : t.status === 'Declined' ? '#fee2e2' : '#fef3c7'}}>{t.status}</span></div>
              {t.status === 'Pending' && (<div style={{display:'flex', gap:8, marginTop:10}}><button onClick={() => respondTrial(t.id, 'Accepted')} style={{flex:1, background:'#2563eb', color:'white', border:'none', padding:'10px', borderRadius:10, fontWeight:700, cursor:'pointer'}}>✅ Accept Trial</button><button onClick={() => respondTrial(t.id, 'Declined')} style={{flex:1, background:'#e5e7eb', border:'none', padding:'10px', borderRadius:10, fontWeight:700, cursor:'pointer'}}>❌ Decline</button></div>)}
              {t.status === 'Accepted' && <div style={{marginTop:10, background:'#dcfce7', padding:10, borderRadius:10, fontSize:13, fontWeight:700}}>✅ You accepted this trial — See you at {t.location} on {t.trialDate} at {t.trialTime}</div>}
            </div>
          ))}
        </div>
      )}

      {user.role === 'Talent' && (<div style={{background:'#FFF8E7', padding:16, borderRadius:16, marginBottom:16, boxShadow:'0 4px 12px rgba(0,0,0,0.08)', border:'1px solid #FDE68A'}}><h3 style={{margin:'0 0 8px'}}>🎥 My Highlights</h3><p style={{margin:'0 0 10px', color:'#666', fontSize:13}}>Upload real clips (max 100s each, up to 5)</p><label style={{display:'block', background: myClipUrls.length >= 5 ? '#999' : '#1a7a2e', color:'white', textAlign:'center', padding:'12px', borderRadius:10, fontWeight:700, cursor:'pointer'}}>{uploading ? '⏳ Saving...' : myClipUrls.length >= 5 ? '✅ You have 5/5 clips' : `📹 Upload Clip (${myClipUrls.length}/5)`}<input type="file" accept="video/*" onChange={handleClipUpload} style={{display:'none'}} disabled={myClipUrls.length >= 5} /></label>{myClipUrls.map((url, i) => (<div key={i} style={{position:'relative', marginTop:12}}><video style={{width:'100%', height:220, borderRadius:12, background:'black'}} src={url} controls playsInline /><button onClick={() => handleDeleteClip(i)} style={{position:'absolute', top:8, right:8, background:'red', color:'white', border:'none', borderRadius:20, padding:'6px 10px', cursor:'pointer', fontSize:12}}>🗑️ Delete Clip {i+1}</button></div>))}<p style={{margin:'16px 0 10px', color:'#666', fontSize:13}}>Or paste a YouTube link</p><div style={{display:'flex', gap:8}}><input style={{flex:1, padding:'10px 12px', borderRadius:10, border:'1px solid #FDE68A', background:'white'}} placeholder="https://youtube.com/watch?v=..." value={videoInput} onChange={e => setVideoInput(e.target.value)} /><button className="btn btn-primary" onClick={handleSaveVideo} style={{margin:0}}>Save Link</button></div>{myClipUrls.length === 0 && getVideo(user.id) && getYouTubeEmbed(getVideo(user.id)) && (<iframe style={{width:'100%', height:220, borderRadius:12, marginTop:12, border:'none'}} src={getYouTubeEmbed(getVideo(user.id))} allowFullScreen title="Highlights"></iframe>)}</div>)}

      {user.role === 'Scout' && <div className="tabs"><button className={`btn btn-filter ${view === 'all' ? 'active' : 'inactive'}`} onClick={() => setView('all')}>All Talents</button><button className={`btn btn-filter ${view === 'shortlist' ? 'active' : 'inactive'}`} onClick={() => setView('shortlist')}>⭐ My Shortlist ({shortlist.length})</button></div>}
      <div className="search-row"><input placeholder="🔍 Search player..." value={search} onChange={e => setSearch(e.target.value)} /><select value={filterPos} onChange={e => setFilterPos(e.target.value)}><option>All</option><option>Striker</option><option>Midfielder</option><option>Defender</option><option>Goalkeeper</option><option>Winger</option></select></div>
      <h3 style={{margin:'0 0 14px'}}>Discover Talents ({filtered.length})</h3>
      <div className="talent-grid">
        {filtered.map(t => { const isShort = shortlist.includes(t.id); const clips = clipUrls[t.id] || []; const embed = getYouTubeEmbed(getVideo(t.id)); const req = getRequestForTalent(t.email); const trial = getTrialForTalent(t.email); return (
          <div key={t.id} className={`talent-card ${isShort ? 'shortlisted' : ''}`} onClick={() => setSelectedTalent(t)} style={{ cursor: 'pointer', background: '#FFF8E7', border: '1px solid #FDE68A' }}>
            <img className="avatar-small-img" src={getPhoto(t.id)} alt={t.fullName} /><h3>{t.fullName}</h3><p>{t.position}</p><div className="meta">📍 {t.location} • {t.age} yrs</div>
            {clips.length ? clips.map((url, i) => (<video key={i} style={{width:'100%', height:160, borderRadius:10, margin:'10px 0', background:'black'}} src={url} controls playsInline />)) : embed ? <iframe style={{width:'100%', height:160, borderRadius:10, margin:'10px 0', border:'none'}} src={embed} allowFullScreen title={t.fullName}></iframe> : <p style={{fontSize:12, color:'#999', margin:'10px 0'}}>🎥 No highlights yet</p>}
            {user.role === 'Scout' && (<>
              <button className={`btn ${isShort ? 'btn-shortlisted' : 'btn-shortlist'}`} onClick={(e) => { e.stopPropagation(); toggleShortlist(t.id); }}>{isShort ? '⭐ Shortlisted - Tap to Remove' : '☆ Add to Shortlist'}</button>
              {!req && <button className="btn btn-primary" style={{marginTop:8}} onClick={(e) => { e.stopPropagation(); sendContactRequest(t); }}>📩 Request to Contact</button>}
              {req && req.status === 'Pending' && <button className="btn btn-secondary" style={{marginTop:8, opacity:0.7}} disabled>⏳ Requested — Waiting</button>}
              {req && req.status === 'Accepted' && (<div style={{marginTop:8, background:'#dcfce7', padding:'12px', borderRadius:10, textAlign:'center'}} onClick={(e) => e.stopPropagation()}><b style={{fontSize:13}}>✅ Accepted — Contact {t.fullName}</b><div style={{fontSize:12, color:'#333', margin:'4px 0 8px'}}>{t.email}</div><div style={{display:'flex', gap:6}}><a href={`mailto:${t.email}?subject=Zambezi Talent - Trial / Interest&body=Hi ${t.fullName}, I saw your profile on Zambezi Talent and would like to talk.`} style={{flex:1, background:'#1a7a2e', color:'white', padding:'9px', borderRadius:8, fontWeight:700, fontSize:12, textDecoration:'none', textAlign:'center'}}>📧 Email</a><button onClick={() => copyToClipboard(t.email)} style={{flex:1, background:'white', border:'1px solid #ddd', padding:'9px', borderRadius:8, fontWeight:700, fontSize:12, cursor:'pointer'}}>📋 Copy</button></div>
                {!trial && <button onClick={() => sendTrialInvite(t)} style={{width:'100%', marginTop:8, background:'#2563eb', color:'white', border:'none', padding:'10px', borderRadius:8, fontWeight:700, cursor:'pointer'}}>📅 Send Trial Invite</button>}
                {trial && trial.status === 'Pending' && <div style={{marginTop:8, background:'#fef3c7', padding:10, borderRadius:8, fontSize:12}}><b>⏳ Trial Pending</b><div>📅 {trial.trialDate} at {trial.trialTime}</div><div>📍 {trial.location}</div></div>}
                {trial && trial.status === 'Accepted' && <div style={{marginTop:8, background:'#dcfce7', padding:10, borderRadius:8, fontSize:12, fontWeight:700}}>✅ Trial Accepted!<div>📅 {trial.trialDate} at {trial.trialTime}</div><div>📍 {trial.location}</div></div>}
                {trial && trial.status === 'Declined' && <div style={{marginTop:8, background:'#fee2e2', padding:10, borderRadius:8, fontSize:12}}>❌ Trial Declined — <button onClick={() => sendTrialInvite(t)} style={{background:'none', border:'none', color:'#2563eb', fontWeight:700, cursor:'pointer', textDecoration:'underline'}}>Send Another?</button></div>}
              </div>)}
              {req && req.status === 'Declined' && <div style={{marginTop:8, background:'#fee2e2', padding:'10px', borderRadius:10, fontSize:13, textAlign:'center'}}>❌ Declined by Talent</div>}
            </>)}
          </div>)})}
      </div>
      {filtered.length === 0 && <p style={{textAlign:'center', color:'#aaa', marginTop:30}}>No players found.</p>}
    </div>
  )
}