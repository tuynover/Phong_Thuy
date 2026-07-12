import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { updateProfile, changePassword, sendVerificationEmail, verifyEmail } from '../services/api';
import { User, Phone, Mail, Calendar, Clock, Sparkles, Lock, Coins, ShieldCheck, CheckCircle2 } from 'lucide-react';

export default function ProfileBoard() {
  const { user, setUser } = useContext(AuthContext);
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [gender, setGender] = useState(user?.gender !== undefined ? user.gender : 1);
  const [day, setDay] = useState(user?.baziInfo?.day || '');
  const [month, setMonth] = useState(user?.baziInfo?.month || '');
  const [year, setYear] = useState(user?.baziInfo?.year || '');
  const [hour, setHour] = useState(user?.baziInfo?.hour !== undefined ? user.baziInfo.hour : '');
  const [minute, setMinute] = useState(user?.baziInfo?.minute !== undefined ? user.baziInfo.minute : '');

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Password change states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState({ type: '', text: '' });

  // Email verification states
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [verificationError, setVerificationError] = useState('');
  const [verificationSuccess, setVerificationSuccess] = useState('');

  // Update local state when user context changes
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
      setGender(user.gender !== undefined ? user.gender : 1);
      setDay(user.baziInfo?.day || '');
      setMonth(user.baziInfo?.month || '');
      setYear(user.baziInfo?.year || '');
      setHour(user.baziInfo?.hour !== undefined ? user.baziInfo.hour : '');
      setMinute(user.baziInfo?.minute !== undefined ? user.baziInfo.minute : '');
    }
  }, [user]);

  // Smooth scroll to profile and password error/success messages
  useEffect(() => {
    if (message.text) {
      setTimeout(() => {
        const element = document.getElementById('profile-message-box');
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }
  }, [message]);

  useEffect(() => {
    if (passwordMessage.text) {
      setTimeout(() => {
        const element = document.getElementById('password-message-box');
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }
  }, [passwordMessage]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    // Validate phone
    if (phone && !/^0[0-9]{9}$/.test(phone)) {
      setMessage({ type: 'error', text: 'Số điện thoại không hợp lệ. Phải gồm đúng 10 số và bắt đầu bằng số 0.' });
      // Rollback changes on validation failure
      setPhone(user?.phone || '');
      setName(user?.name || '');
      setLoading(false);
      return;
    }

    // Validate baziInfo partially or fully
    let baziData = {};
    if (day || month || year || hour !== '' || minute !== '') {
      // If any Bazi field is filled, require them all (or clean them up)
      if (!day || !month || !year || hour === '' || minute === '') {
        setMessage({ type: 'error', text: 'Vui lòng điền đầy đủ thông tin ngày, tháng, năm, giờ và phút sinh của Bát Tự.' });
        setLoading(false);
        return;
      }
      baziData = {
        day: parseInt(day),
        month: parseInt(month),
        year: parseInt(year),
        hour: parseInt(hour),
        minute: parseInt(minute)
      };
    } else {
      // If everything is blank, we can send null to clear it
      baziData = {
        day: null,
        month: null,
        year: null,
        hour: null,
        minute: null
      };
    }

    try {
      const payload = {
        userId: user.id || user._id,
        name,
        phone,
        gender: parseInt(gender),
        ...baziData
      };
      
      const res = await updateProfile(payload);
      
      // Update local storage and context
      localStorage.setItem('user', JSON.stringify(res.data.user));
      setUser(res.data.user);
      
      setMessage({ type: 'success', text: 'Cập nhật thông tin tài khoản thành công!' });
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: err.response?.data?.message || 'Không thể lưu thông tin. Vui lòng thử lại.' });
    }
    setLoading(false);
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordLoading(true);
    setPasswordMessage({ type: '', text: '' });

    if (newPassword.length < 8) {
      setPasswordMessage({ type: 'error', text: 'Mật khẩu mới phải có độ dài tối thiểu 8 ký tự.' });
      setPasswordLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'Mật khẩu mới và xác nhận mật khẩu không khớp.' });
      setPasswordLoading(false);
      return;
    }

    if (newPassword === currentPassword) {
      setPasswordMessage({ type: 'error', text: 'Mật khẩu mới không được trùng với mật khẩu hiện tại.' });
      setPasswordLoading(false);
      return;
    }

    try {
      await changePassword(currentPassword, newPassword);
      setPasswordMessage({ type: 'success', text: 'Thay đổi mật khẩu thành công!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      console.error(err);
      setPasswordMessage({ type: 'error', text: err.response?.data?.message || 'Không thể đổi mật khẩu. Vui lòng thử lại.' });
    }
    setPasswordLoading(false);
  };

  const handleSendOtp = async () => {
    setOtpSent(true);
    setOtpLoading(true);
    setVerificationError('');
    setVerificationSuccess('Đang gửi mã OTP xác thực đến email của bạn...');
    try {
      await sendVerificationEmail();
      setVerificationSuccess('Mã OTP đã được gửi thành công đến email của bạn.');
    } catch (err) {
      console.error(err);
      setVerificationError(err.response?.data?.message || 'Không thể gửi email xác thực. Vui lòng thử lại.');
      setOtpSent(false);
    }
    setOtpLoading(false);
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setOtpLoading(true);
    setVerificationError('');
    setVerificationSuccess('');
    if (otp.length < 4 || otp.length > 6) {
      setVerificationError('Mã OTP phải có độ dài từ 4 đến 6 ký tự.');
      setOtpLoading(false);
      return;
    }
    try {
      const res = await verifyEmail(otp);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      setUser(res.data.user);
      setVerificationSuccess(res.data.message || 'Xác thực email thành công!');
      setOtpSent(false);
      setOtp('');
    } catch (err) {
      console.error(err);
      setVerificationError(err.response?.data?.message || 'Xác thực email thất bại.');
    }
    setOtpLoading(false);
  };



  return (
    <div className="max-w-2xl mx-auto my-6 p-4 sm:p-8 bg-white border border-gray-150 rounded-3xl shadow-xl animate-in fade-in duration-300">
      

      
      <div className="text-center mb-8">
        <div className="inline-flex p-3 bg-amber-50 rounded-full border border-amber-250 mb-3">
          <User className="text-amber-800" size={32} />
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold font-serif text-amber-950">Thông Tin Cá Nhân</h2>
        <p className="text-sm text-gray-500 mt-1">Quản lý thông tin tài khoản và ngày sinh học thuật của bạn</p>
      </div>

      {/* Credits and Verification Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        {/* Credits card */}
        <div className="bg-amber-50/40 p-4 border border-amber-200/50 rounded-2xl flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-100/80 rounded-xl border border-amber-250">
              <Coins className="text-amber-800" size={20} />
            </div>
            <div>
              <p className="text-[10px] text-neutral-500 font-extrabold uppercase tracking-wider">Số lượt sử dụng</p>
              <p className="text-base font-extrabold font-[Montserrat] text-amber-950 mt-0.5">{user?.credits !== undefined ? user.credits : 0} Credits</p>
            </div>
          </div>
        </div>

        {/* Email Verification card */}
        <div className="bg-slate-50 p-4 border border-gray-200/60 rounded-2xl flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl border ${user?.isEmailVerified ? 'bg-emerald-50 border-emerald-250' : 'bg-rose-50 border-rose-250'}`}>
              {user?.isEmailVerified ? (
                <CheckCircle2 className="text-emerald-800" size={20} />
              ) : (
                <Mail className="text-rose-800" size={20} />
              )}
            </div>
            <div>
              <p className="text-[10px] text-neutral-500 font-extrabold uppercase tracking-wider">Trạng thái Email</p>
              <p className={`text-xs font-extrabold mt-0.5 ${user?.isEmailVerified ? 'text-emerald-700' : 'text-rose-700'}`}>
                {user?.isEmailVerified ? 'Đã xác thực (+2🪙)' : 'Chưa xác thực'}
              </p>
            </div>
          </div>
          
          {!user?.isEmailVerified && (
            <button
              type="button"
              onClick={handleSendOtp}
              disabled={otpLoading}
              className="px-3 py-1.5 bg-amber-800 hover:bg-amber-900 text-white rounded-lg text-xs font-bold transition-all disabled:opacity-55"
            >
              {otpLoading ? 'Đang gửi...' : 'Xác thực'}
            </button>
          )}
        </div>
      </div>


      
      {/* Email OTP Verification Inline Messages (when OTP form is hidden) */}
      {!otpSent && verificationError && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs font-bold mb-6 text-center animate-in fade-in duration-300">
          {verificationError}
        </div>
      )}
      {!otpSent && verificationSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-250 text-emerald-800 rounded-xl text-xs font-bold mb-6 text-center animate-in fade-in duration-300">
          {verificationSuccess}
        </div>
      )}

      {/* OTP verification box */}
      {otpSent && (
        <div className="bg-amber-50/20 border border-amber-250 p-5 rounded-2xl mb-6 space-y-3 animate-in slide-in-from-top-2 duration-300">
          <h4 className="text-sm font-extrabold text-amber-950 uppercase tracking-wider flex items-center gap-1.5">
            <ShieldCheck size={16} className="text-amber-800" />
            Nhập mã xác thực OTP
          </h4>
          <p className="text-xs text-gray-500">Mã OTP gồm 6 chữ số đã được gửi tới email <strong>{user?.email}</strong> của bạn.</p>
          
          <form onSubmit={handleVerifyOtp} className="flex gap-2 items-center">
            <input 
              type="text" 
              maxLength="6"
              placeholder="Nhập mã OTP..." 
              value={otp} 
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              className="px-4 py-2 border border-gray-300 rounded-xl text-center text-sm font-bold tracking-widest focus:ring-2 focus:ring-amber-500 focus:border-transparent w-36 transition-all"
              required
            />
            <button
              type="submit"
              disabled={otpLoading}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-55 animate-pulse"
            >
              Xác nhận
            </button>
            <button
              type="button"
              onClick={() => setOtpSent(false)}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-350 text-gray-700 rounded-xl text-xs font-bold transition-all"
            >
              Hủy
            </button>
          </form>
          
          {verificationError && (
            <p className="text-xs font-bold text-red-650 mt-1">{verificationError}</p>
          )}
          {verificationSuccess && (
            <p className="text-xs font-bold text-emerald-650 mt-1">{verificationSuccess}</p>
          )}
        </div>
      )}



      {message.text && (
        <div id="profile-message-box" className={`p-4 rounded-xl mb-6 text-sm font-medium border text-center ${
          message.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Email - Disabled */}
        <div>
          <label className="block text-xs sm:text-sm font-bold text-gray-600 mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
            <Mail size={15} className="text-gray-400" />
            Địa chỉ Email
          </label>
          <input 
            type="email" 
            value={user?.email || ''} 
            disabled 
            className="w-full px-4 py-2.5 bg-gray-100 border border-gray-200 rounded-xl text-gray-500 font-semibold cursor-not-allowed focus:outline-none"
            title="Email đăng ký làm tài khoản không thể chỉnh sửa"
          />
          <p className="text-xs text-gray-400 mt-1">Email đăng ký làm tài khoản không thể thay đổi.</p>
        </div>

        {/* Name */}
        <div>
          <label className="block text-xs sm:text-sm font-bold text-gray-600 mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
            <User size={15} className="text-gray-400" />
            Họ và Tên
          </label>
          <input 
            type="text" 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            required
            className="w-full px-4 py-2.5 bg-amber-50/10 border border-gray-300 rounded-xl text-gray-800 font-medium focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
            placeholder="Nhập họ và tên..."
          />
        </div>

        {/* Phone Number */}
        <div>
          <label className="block text-xs sm:text-sm font-bold text-gray-600 mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
            <Phone size={15} className="text-gray-400" />
            Số Điện Thoại
          </label>
          <input 
            type="tel" 
            value={phone} 
            onChange={(e) => setPhone(e.target.value)} 
            className="w-full px-4 py-2.5 bg-amber-50/10 border border-gray-300 rounded-xl text-gray-800 font-medium focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
            placeholder="Nhập số điện thoại..."
          />
        </div>

        {/* Gender Selection */}
        <div>
          <label className="block text-xs sm:text-sm font-bold text-gray-600 mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles size={15} className="text-gray-400" />
            Giới tính
          </label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer bg-slate-50 px-4 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-100 flex-1 justify-center transition-colors">
              <input 
                type="radio" 
                name="gender" 
                value={1} 
                checked={gender === 1}
                onChange={() => setGender(1)}
                className="text-amber-800 focus:ring-amber-500"
              />
              <span className="font-semibold text-gray-700 text-sm">Nam</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer bg-slate-50 px-4 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-100 flex-1 justify-center transition-colors">
              <input 
                type="radio" 
                name="gender" 
                value={0} 
                checked={gender === 0}
                onChange={() => setGender(0)}
                className="text-amber-800 focus:ring-amber-500"
              />
              <span className="font-semibold text-gray-700 text-sm">Nữ</span>
            </label>
          </div>
        </div>

        {/* Bazi / Birth Information */}
        <div className="pt-4 border-t border-gray-100">
          <h3 className="text-sm font-extrabold text-amber-950 uppercase tracking-widest mb-4">Thông tin lá số Bát Tự / Tử Vi</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Solar Date */}
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar size={14} className="text-gray-400" />
                Ngày sinh Dương Lịch
              </label>
              <div className="flex gap-2">
                <input 
                  type="number" 
                  min="1" 
                  max="31" 
                  placeholder="Ngày" 
                  value={day} 
                  onChange={(e) => setDay(e.target.value)} 
                  className="w-1/3 px-2 py-2 border border-gray-300 rounded-lg text-sm text-center focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                />
                <input 
                  type="number" 
                  min="1" 
                  max="12" 
                  placeholder="Tháng" 
                  value={month} 
                  onChange={(e) => setMonth(e.target.value)} 
                  className="w-1/3 px-2 py-2 border border-gray-300 rounded-lg text-sm text-center focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                />
                <input 
                  type="number" 
                  min="1900" 
                  max="2100" 
                  placeholder="Năm" 
                  value={year} 
                  onChange={(e) => setYear(e.target.value)} 
                  className="w-1/3 px-2 py-2 border border-gray-300 rounded-lg text-sm text-center focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Solar Time */}
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
                <Clock size={14} className="text-gray-400" />
                Giờ & Phút sinh
              </label>
              <div className="flex gap-2">
                <input 
                  type="number" 
                  min="0" 
                  max="23" 
                  placeholder="Giờ" 
                  value={hour} 
                  onChange={(e) => setHour(e.target.value)} 
                  className="w-1/2 px-2 py-2 border border-gray-300 rounded-lg text-sm text-center focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                />
                <input 
                  type="number" 
                  min="0" 
                  max="59" 
                  placeholder="Phút" 
                  value={minute} 
                  onChange={(e) => setMinute(e.target.value)} 
                  className="w-1/2 px-2 py-2 border border-gray-300 rounded-lg text-sm text-center focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                />
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-2">Dùng để tự động tính toán lá số Bát Tự và Tử Vi cho tài khoản của bạn.</p>
        </div>

        {/* Submit Button */}
        <button 
          type="submit"
          disabled={loading}
          className="w-full bg-amber-800 hover:bg-amber-900 text-white font-bold py-3.5 rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50 mt-4 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Đang lưu...</span>
            </>
          ) : (
            <span>Lưu Thông Tin</span>
          )}
        </button>

      </form>

      {/* Password Change Section */}
      <div className="mt-10 pt-8 border-t border-gray-150 animate-in fade-in duration-300">
        <div className="text-center mb-6">
          <div className="inline-flex p-3 bg-red-50 rounded-full border border-red-200 mb-3">
            <Lock className="text-red-800" size={24} />
          </div>
          <h3 className="text-xl font-bold font-serif text-amber-950">Thay Đổi Mật Khẩu</h3>
          <p className="text-xs text-gray-500 mt-1">Cập nhật mật khẩu bảo vệ tài khoản của bạn</p>
        </div>

        {passwordMessage.text && (
          <div id="password-message-box" className={`p-4 rounded-xl mb-6 text-sm font-medium border text-center ${
            passwordMessage.type === 'success' 
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            {passwordMessage.text}
          </div>
        )}

        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div>
            <label className="block text-xs sm:text-sm font-bold text-gray-600 mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
              Mật khẩu hiện tại
            </label>
            <input 
              type="password" 
              value={currentPassword} 
              onChange={(e) => setCurrentPassword(e.target.value)} 
              required
              className="w-full px-4 py-2.5 bg-amber-50/10 border border-gray-300 rounded-xl text-gray-800 font-medium focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
              placeholder="Nhập mật khẩu hiện tại..."
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-bold text-gray-600 mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
              Mật khẩu mới
            </label>
            <input 
              type="password" 
              value={newPassword} 
              onChange={(e) => setNewPassword(e.target.value)} 
              required
              className="w-full px-4 py-2.5 bg-amber-50/10 border border-gray-300 rounded-xl text-gray-800 font-medium focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
              placeholder="Tối thiểu 8 ký tự..."
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-bold text-gray-600 mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
              Xác nhận mật khẩu mới
            </label>
            <input 
              type="password" 
              value={confirmPassword} 
              onChange={(e) => setConfirmPassword(e.target.value)} 
              required
              className="w-full px-4 py-2.5 bg-amber-50/10 border border-gray-300 rounded-xl text-gray-800 font-medium focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
              placeholder="Nhập lại mật khẩu mới..."
            />
          </div>

          <button 
            type="submit"
            disabled={passwordLoading}
            className="w-full bg-red-800 hover:bg-red-900 text-white font-bold py-3.5 rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50 mt-4 flex items-center justify-center gap-2 text-sm"
          >
            {passwordLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Đang xử lý...</span>
              </>
            ) : (
              <span>Cập Nhật Mật Khẩu</span>
            )}
          </button>
        </form>
      </div>

    </div>
  );
}
