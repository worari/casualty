import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, User, Lock, UserPlus, LogOut, FileText, 
  Clock, CheckCircle, Users, Database, MapPin, Search, Plus, 
  ArrowRight, ArrowLeft, Send
} from 'lucide-react';

// ==========================================
// MOCK SUPABASE CLIENT (สำหรับการดู Preview ในหน้าเว็บ)
// ==========================================
// หมายเหตุ: ระบบจำลองนี้ทำขึ้นเพื่อให้สามารถแสดงผล Preview UI และทดลองใช้งานได้
// โดยไม่ต้องเชื่อมต่อ API จริง สำหรับการนำไปใช้งาน/Deploy บน Vercel ให้เปลี่ยนไปใช้:
import { createClient } from '@supabase/supabase-js';
const supabase = createClient('https://gfuuxwlbgfvtrekdhzft.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdmdXV4d2xiZ2Z2dHJla2RoemZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ1MjE1ODcsImV4cCI6MjEwMDA5NzU4N30.2oew9ulW9E7Sv3DgcJHQVRTMhCjWLa7amdudMRpAuwk');

let mockDB = {
  users: [{ id: '1', username: 'admin', password_hash: '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', rank: 'พ.อ.', fname: 'ผู้ดูแล', lname: 'ระบบ', role: 'admin', status: 'approved' }],
  reports: [],
  casualties: []
};

const supabase = {
  from: (table) => {
    let chain = {
      data: [...(mockDB[table] || [])],
      _isCount: false,
      select: function(q, opts) {
          if (opts && opts.count) this._isCount = true;
          return this;
      },
      eq: function(key, val) { this.data = this.data.filter(item => item[key] === val); return this; },
      in: function(key, vals) { this.data = this.data.filter(item => vals.includes(item[key])); return this; },
      order: function() { this.data = this.data.sort((a,b) => b.created_at - a.created_at); return this; },
      single: async function() {
        if (this.data.length === 0) return { error: new Error('ไม่พบข้อมูลผู้ใช้งาน'), data: null };
        return { error: null, data: this.data[0] };
      },
      then: function(resolve) {
         if (this._isCount) return resolve({ count: this.data.length, data: this.data, error: null });
         if (table === 'reports') {
             this.data = this.data.map(report => ({
                 ...report,
                 casualties: mockDB.casualties.filter(c => c.report_id === report.id)
             }));
         }
         return resolve({ data: this.data, error: null });
      },
      insert: function(payload) {
        const arr = Array.isArray(payload) ? payload : [payload];
        const inserted = arr.map(item => ({ id: Math.random().toString(36).substring(7), created_at: Date.now(), ...item }));
        mockDB[table] = [...(mockDB[table] || []), ...inserted];
        return {
            select: function() {
                return {
                    single: async () => ({ error: null, data: inserted[0] })
                }
            },
            then: function(resolve) { resolve({ error: null, data: inserted }); }
        };
      },
      update: function(payload) {
         return {
             eq: async function(key, val) {
                 mockDB[table] = mockDB[table].map(item => item[key] === val ? { ...item, ...payload } : item);
                 return { error: null };
             }
         };
      }
    };
    return chain;
  }
};

// ฟังก์ชัน Hash Password จำลอง (เหมือนฝั่ง GAS เดิม)
const hashPassword = async (password) => {
  const msgBuffer = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

export default function App() {
  const [session, setSession] = useState(null); // เก็บข้อมูลผู้ใช้ที่ Login
  const [currentView, setCurrentView] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // ตรวจสอบ Session เมื่อโหลดแอป
  useEffect(() => {
    const savedSession = localStorage.getItem('casualty_user');
    if (savedSession) {
      setSession(JSON.parse(savedSession));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('casualty_user');
    setSession(null);
  };

  // ถ้ายังไม่ Login ให้แสดงหน้า Auth
  if (!session) {
    return <AuthScreen onLogin={(user) => {
      setSession(user);
      localStorage.setItem('casualty_user', JSON.stringify(user));
    }} />;
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans text-gray-800">
      {/* Sidebar */}
      <aside className={`bg-slate-800 text-white w-64 flex-shrink-0 flex flex-col transition-all duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} absolute md:relative z-40 h-full`}>
        <div className="flex items-center justify-between p-4 border-b border-slate-700 h-16">
          <div className="flex items-center space-x-3 font-bold text-lg">
            <ShieldAlert className="text-red-500" />
            <span>ระบบรายงานสูญเสีย</span>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-2">
            {session.role === 'admin' && (
              <li>
                <button onClick={() => setCurrentView('stats')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${currentView === 'stats' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-slate-700'}`}>
                  <FileText size={20} /><span>แดชบอร์ดสรุป</span>
                </button>
              </li>
            )}
            <li>
              <button onClick={() => setCurrentView('dashboard')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${currentView === 'dashboard' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-slate-700'}`}>
                <Clock size={20} /><span>ประวัติรายงานที่ส่ง</span>
              </button>
            </li>
            {session.role === 'admin' && (
              <>
                <li>
                  <button onClick={() => setCurrentView('users')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${currentView === 'users' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-slate-700'}`}>
                    <Users size={20} /><span>จัดการผู้ใช้งาน</span>
                  </button>
                </li>
                <li>
                  <button onClick={() => setCurrentView('master')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${currentView === 'master' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-slate-700'}`}>
                    <Database size={20} /><span>ฐานข้อมูลหลัก</span>
                  </button>
                </li>
              </>
            )}
          </ul>
        </nav>
        <div className="p-4 border-t border-slate-700">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center">
              <User size={16} />
            </div>
            <div>
              <p className="text-sm font-medium">{session.rank} {session.fname}</p>
              <p className="text-xs text-gray-400">{session.position}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="w-full flex items-center justify-center space-x-2 py-2 border border-slate-600 rounded-md text-sm text-gray-300 hover:bg-slate-700 transition-colors">
            <LogOut size={16} /><span>ออกจากระบบ</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full relative">
        <header className="h-16 bg-white shadow-sm flex items-center px-4 md:px-6 z-30">
          <button className="md:hidden mr-4 text-gray-500" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
            <div className="w-6 h-0.5 bg-current mb-1"></div>
            <div className="w-6 h-0.5 bg-current mb-1"></div>
            <div className="w-6 h-0.5 bg-current"></div>
          </button>
          <h1 className="text-lg font-semibold">
            {currentView === 'stats' ? 'แดชบอร์ดสรุปภาพรวม' : 
             currentView === 'dashboard' ? 'ประวัติรายงาน' : 
             currentView === 'users' ? 'จัดการผู้ใช้งาน' : 'ฐานข้อมูลหลัก'}
          </h1>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-gray-50">
          {currentView === 'stats' && <DashboardStats />}
          {currentView === 'dashboard' && <ReportHistory session={session} />}
          {currentView === 'users' && <UserManagement />}
          {currentView === 'master' && <MasterDataManagement />}
        </main>
      </div>
    </div>
  );
}

function AuthScreen({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    const username = e.target.username.value;
    const password = e.target.password.value;

    try {
      const hashedPw = await hashPassword(password);
      
      // ดึงข้อมูลผู้ใช้จาก Supabase
      const { data, error: dbError } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .eq('password_hash', hashedPw)
        .single();

      if (dbError || !data) throw new Error('ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง');
      if (data.status === 'pending') throw new Error('บัญชีรอการอนุมัติจากผู้ดูแลระบบ');
      if (data.status !== 'approved') throw new Error('บัญชีถูกระงับการใช้งาน');

      onLogin(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    try {
      const hashedPw = await hashPassword(data.password);
      
      const { error: insertError } = await supabase.from('users').insert([{
        username: data.username,
        password_hash: hashedPw,
        rank: data.rank,
        fname: data.fname,
        lname: data.lname,
        phone: data.phone
      }]);

      if (insertError) throw new Error(insertError.message.includes('unique') ? 'ชื่อผู้ใช้นี้มีคนใช้แล้ว' : 'เกิดข้อผิดพลาดในการลงทะเบียน');
      
      alert('ลงทะเบียนสำเร็จ กรุณารอแอดมินอนุมัติ');
      setIsLogin(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900 flex items-center justify-center p-4" style={{backgroundImage: 'linear-gradient(rgba(15,23,42,0.8), rgba(15,23,42,0.8)), url("https://images.unsplash.com/photo-1574627452814-11884488dbbd?q=80&w=2070&auto=format&fit=crop")', backgroundSize: 'cover'}}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
            <ShieldAlert className="text-red-600" size={32} />
          </div>
          <h2 className="text-2xl font-bold text-gray-800">ระบบรายงานการสูญเสีย</h2>
          <p className="text-sm text-gray-500 mt-1">กำลังพลปฏิบัติหน้าที่ราชการสนาม</p>
        </div>

        {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">{error}</div>}

        {isLogin ? (
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อผู้ใช้งาน</label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 text-gray-400" size={18} />
                <input name="username" type="text" required className="w-full pl-10 pr-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">รหัสผ่าน</label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 text-gray-400" size={18} />
                <input name="password" type="password" required className="w-full pl-10 pr-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500" />
              </div>
            </div>
            <button type="submit" disabled={loading} className="w-full py-2.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium">
              {loading ? 'กำลังโหลด...' : 'เข้าสู่ระบบ'}
            </button>
            <p className="text-center text-sm text-gray-600 mt-4">
              ยังไม่มีบัญชี? <button type="button" onClick={() => setIsLogin(false)} className="text-blue-600 hover:underline">ลงทะเบียน</button>
            </p>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-xs text-gray-700">ยศ</label>
                <input name="rank" required className="w-full p-2 border rounded-md text-sm" placeholder="เช่น พล.อ., ร.ต., จ.ส.อ." />
              </div>
              <div><label className="block text-xs text-gray-700">ชื่อ</label><input name="fname" required className="w-full p-2 border rounded-md text-sm" /></div>
              <div><label className="block text-xs text-gray-700">นามสกุล</label><input name="lname" required className="w-full p-2 border rounded-md text-sm" /></div>
              <div className="col-span-2"><label className="block text-xs text-gray-700">เบอร์โทรศัพท์</label><input name="phone" required className="w-full p-2 border rounded-md text-sm" /></div>
              <div className="col-span-2 border-t pt-4"><label className="block text-xs text-gray-700">ชื่อผู้ใช้งาน (Username)</label><input name="username" required className="w-full p-2 border rounded-md text-sm" /></div>
              <div className="col-span-2"><label className="block text-xs text-gray-700">รหัสผ่าน</label><input name="password" type="password" required className="w-full p-2 border rounded-md text-sm" /></div>
            </div>
            <div className="flex space-x-3 pt-2">
              <button type="button" onClick={() => setIsLogin(true)} className="flex-1 py-2 border rounded-md text-gray-700">ยกเลิก</button>
              <button type="submit" disabled={loading} className="flex-1 py-2 bg-green-600 text-white rounded-md flex justify-center items-center">
                <UserPlus size={16} className="mr-2"/> ขอลงทะเบียน
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function DashboardStats() {
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, users: 0 });

  useEffect(() => {
    async function fetchStats() {
      // ใช้ count ของ Supabase เพื่อดึงจำนวน
      const { count: total } = await supabase.from('reports').select('*', { count: 'exact', head: true });
      const { count: pending } = await supabase.from('reports').select('*', { count: 'exact', head: true }).eq('status', 'รอตรวจสอบ');
      const { count: approved } = await supabase.from('reports').select('*', { count: 'exact', head: true }).in('status', ['อนุมัติแล้ว', 'รับทราบ']);
      const { count: users } = await supabase.from('users').select('*', { count: 'exact', head: true });
      
      setStats({ total: total || 0, pending: pending || 0, approved: approved || 0, users: users || 0 });
    }
    fetchStats();
  }, []);

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center"><FileText className="mr-2 text-blue-600"/> สรุปภาพรวม</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="รายงานทั้งหมด" value={stats.total} icon={<FileText size={24}/>} color="bg-blue-100 text-blue-600" />
        <StatCard title="รอตรวจสอบ" value={stats.pending} icon={<Clock size={24}/>} color="bg-yellow-100 text-yellow-600" />
        <StatCard title="อนุมัติแล้ว" value={stats.approved} icon={<CheckCircle size={24}/>} color="bg-green-100 text-green-600" />
        <StatCard title="ผู้ใช้งานระบบ" value={stats.users} icon={<Users size={24}/>} color="bg-purple-100 text-purple-600" />
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex items-center">
      <div className={`w-12 h-12 rounded-full flex items-center justify-center mr-4 ${color}`}>{icon}</div>
      <div>
        <p className="text-sm text-gray-500 font-medium">{title}</p>
        <p className="text-2xl font-bold text-gray-800">{value}</p>
      </div>
    </div>
  );
}

function ReportHistory({ session }) {
  const [reports, setReports] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    let query = supabase.from('reports').select(`*, casualties(*)`).order('created_at', { ascending: false });
    
    // ถ้าไม่ใช่แอดมิน ให้เห็นเฉพาะของตัวเอง
    if (session.role !== 'admin') {
      query = query.eq('created_by', session.id);
    }
    
    const { data, error } = await query;
    if (!error && data) setReports(data);
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">ประวัติรายงาน</h2>
        <button onClick={() => setIsModalOpen(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center">
          <Plus size={18} className="mr-2"/> เพิ่มรายงาน
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">วันที่เกิดเหตุ</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">ภารกิจ</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">ความเร่งด่วน</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">สถานะ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {reports.map(r => (
              <tr key={r.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{new Date(r.event_datetime).toLocaleString('th-TH')}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">{r.mission_type}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs rounded-full font-bold ${r.urgency === 'ด่วนที่สุด' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                    {r.urgency}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">{r.status}</span>
                </td>
              </tr>
            ))}
            {reports.length === 0 && <tr><td colSpan="4" className="text-center py-8 text-gray-500">ไม่พบข้อมูลรายงาน</td></tr>}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <ReportFormModal 
          session={session} 
          onClose={() => setIsModalOpen(false)} 
          onSuccess={() => { setIsModalOpen(false); fetchReports(); }} 
        />
      )}
    </div>
  );
}

function ReportFormModal({ session, onClose, onSuccess }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    urgency: 'ด่วน', event_datetime: '', mission_type: '', summary: '', mgrs_coord: '',
    reporter_rank: session.rank || '', reporter_name: session.fname || '', reporter_phone: session.phone || '',
    casualties: [{ mil_type: 'ทหารกองประจำการ', rank: '', fname: '', lname: '', casualty_type: 'บาดเจ็บ' }]
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // 1. บันทึก Report
      const { data: reportData, error: reportError } = await supabase.from('reports').insert([{
        urgency: formData.urgency,
        event_datetime: formData.event_datetime,
        mission_type: formData.mission_type,
        summary: formData.summary,
        mgrs_coord: formData.mgrs_coord,
        reporter_rank: formData.reporter_rank,
        reporter_name: formData.reporter_name,
        reporter_phone: formData.reporter_phone,
        created_by: session.id
      }]).select().single();

      if (reportError) throw reportError;

      // 2. บันทึก Casualties (ผู้สูญเสีย)
      const casualtiesToInsert = formData.casualties.map(c => ({
        report_id: reportData.id,
        mil_type: c.mil_type,
        rank: c.rank,
        fname: c.fname,
        lname: c.lname,
        casualty_type: c.casualty_type
      }));

      const { error: casError } = await supabase.from('casualties').insert(casualtiesToInsert);
      if (casError) throw casError;

      alert('บันทึกรายงานสำเร็จ');
      onSuccess();
    } catch (err) {
      alert('เกิดข้อผิดพลาด: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900 bg-opacity-70 z-50 flex justify-center items-center p-4">
      <div className="bg-white w-full max-w-4xl rounded-xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="p-4 border-b flex justify-between items-center bg-gray-50 rounded-t-xl">
          <h2 className="text-xl font-bold text-gray-800">แบบฟอร์มรายงานการสูญเสีย</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-red-500">✕</button>
        </div>
        
        {/* Stepper Header */}
        <div className="flex p-4 border-b justify-center">
          {[1,2,3].map(i => (
            <div key={i} className={`flex items-center ${i < 3 ? 'w-full' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 ${step === i ? 'bg-blue-600 border-blue-600 text-white' : step > i ? 'bg-green-500 border-green-500 text-white' : 'bg-white text-gray-400 border-gray-300'}`}>{i}</div>
              {i < 3 && <div className={`flex-1 h-1 mx-2 ${step > i ? 'bg-green-500' : 'bg-gray-200'}`}></div>}
            </div>
          ))}
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="font-bold text-red-700 text-lg border-b pb-2">ส่วนที่ 1: ข้อมูลเหตุการณ์</h3>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm mb-1">ความเร่งด่วน</label><select className="w-full p-2 border rounded" value={formData.urgency} onChange={e=>setFormData({...formData, urgency: e.target.value})}><option>ด่วนที่สุด</option><option>ด่วนมาก</option><option>ด่วน</option></select></div>
                <div><label className="block text-sm mb-1">วัน/เวลาเกิดเหตุ</label><input type="datetime-local" className="w-full p-2 border rounded" value={formData.event_datetime} onChange={e=>setFormData({...formData, event_datetime: e.target.value})} /></div>
                <div><label className="block text-sm mb-1">ภารกิจ</label><input type="text" className="w-full p-2 border rounded" value={formData.mission_type} onChange={e=>setFormData({...formData, mission_type: e.target.value})} placeholder="เช่น ลาดตระเวน" /></div>
                <div><label className="block text-sm mb-1">พิกัด MGRS</label><input type="text" className="w-full p-2 border rounded" value={formData.mgrs_coord} onChange={e=>setFormData({...formData, mgrs_coord: e.target.value})} /></div>
                <div className="col-span-2"><label className="block text-sm mb-1">สรุปเหตุการณ์</label><textarea rows="3" className="w-full p-2 border rounded" value={formData.summary} onChange={e=>setFormData({...formData, summary: e.target.value})}></textarea></div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h3 className="font-bold text-blue-700 text-lg border-b pb-2">ส่วนที่ 2: ข้อมูลผู้ประสบเหตุ</h3>
              {formData.casualties.map((c, index) => (
                <div key={index} className="p-4 border rounded-lg bg-blue-50 grid grid-cols-2 gap-4">
                  <div><label className="block text-sm mb-1">ยศ</label><input type="text" className="w-full p-2 border rounded" value={c.rank} onChange={e => { const newC = [...formData.casualties]; newC[index].rank = e.target.value; setFormData({...formData, casualties: newC}); }} /></div>
                  <div><label className="block text-sm mb-1">ชื่อ-สกุล</label><input type="text" className="w-full p-2 border rounded" value={c.fname} onChange={e => { const newC = [...formData.casualties]; newC[index].fname = e.target.value; setFormData({...formData, casualties: newC}); }} /></div>
                  <div className="col-span-2"><label className="block text-sm mb-1">ประเภทการสูญเสีย</label><select className="w-full p-2 border rounded text-red-600 font-bold" value={c.casualty_type} onChange={e => { const newC = [...formData.casualties]; newC[index].casualty_type = e.target.value; setFormData({...formData, casualties: newC}); }}><option>บาดเจ็บ</option><option>เสียชีวิต</option><option>สูญหาย</option></select></div>
                </div>
              ))}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h3 className="font-bold text-slate-700 text-lg border-b pb-2">ส่วนที่ 3: ข้อมูลผู้รายงาน</h3>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm mb-1">ยศ</label><input type="text" className="w-full p-2 border rounded bg-gray-100" value={formData.reporter_rank} readOnly /></div>
                <div><label className="block text-sm mb-1">ชื่อ-สกุล</label><input type="text" className="w-full p-2 border rounded bg-gray-100" value={formData.reporter_name} readOnly /></div>
                <div className="col-span-2"><label className="block text-sm mb-1">เบอร์ติดต่อ</label><input type="text" className="w-full p-2 border rounded" value={formData.reporter_phone} onChange={e=>setFormData({...formData, reporter_phone: e.target.value})} /></div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Buttons */}
        <div className="p-4 border-t flex justify-between bg-gray-50 rounded-b-xl">
          <button onClick={() => step > 1 ? setStep(step-1) : onClose()} className="px-4 py-2 border rounded bg-white text-gray-700 hover:bg-gray-100">
            {step === 1 ? 'ยกเลิก' : 'ย้อนกลับ'}
          </button>
          {step < 3 ? (
            <button onClick={() => setStep(step+1)} className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center">
              ถัดไป <ArrowRight size={16} className="ml-2"/>
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={loading} className="px-6 py-2 bg-red-600 text-white font-bold rounded shadow-md hover:bg-red-700 flex items-center">
              {loading ? 'กำลังส่ง...' : <><Send size={16} className="mr-2"/> ส่งรายงานด่วน</>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function UserManagement() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const { data, error } = await supabase.from('users').select('*').order('created_at', { ascending: false });
    if (!error) setUsers(data);
  };

  const updateStatus = async (id, status) => {
    await supabase.from('users').update({ status }).eq('id', id);
    fetchUsers();
  };

  return (
    <div className="bg-white rounded-xl shadow border p-6">
      <h2 className="text-xl font-bold mb-4">จัดการผู้ใช้งานระบบ</h2>
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-gray-100"><th className="p-3">Username</th><th className="p-3">ยศ-ชื่อ</th><th className="p-3">สถานะ</th><th className="p-3">จัดการ</th></tr>
        </thead>
        <tbody>
          {users.map(u => (
            <tr key={u.id} className="border-b">
              <td className="p-3">{u.username}</td>
              <td className="p-3">{u.rank} {u.fname}</td>
              <td className="p-3">
                <span className={`px-2 py-1 text-xs rounded-full ${u.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>{u.status}</span>
              </td>
              <td className="p-3">
                {u.status === 'pending' && <button onClick={() => updateStatus(u.id, 'approved')} className="text-green-600 hover:underline mr-3">อนุมัติ</button>}
                <button onClick={() => updateStatus(u.id, 'rejected')} className="text-red-600 hover:underline">ปฏิเสธ</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MasterDataManagement() {
  return (
    <div className="bg-white rounded-xl shadow border p-6 text-center text-gray-500">
      <Database size={48} className="mx-auto mb-4 text-gray-300"/>
      <h2 className="text-xl font-bold mb-2">จัดการฐานข้อมูลหลัก</h2>
      <p>คุณสามารถจัดการ Master Data (หน่วย, ตำแหน่ง, ประเภทภารกิจ) ได้โดยตรงผ่าน Supabase Dashboard ชั่วคราว</p>
    </div>
  );
}