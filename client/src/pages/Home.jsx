import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

const bannerSlides = [
  {
    type: 'play',
    title: '🎲 Play Ludo & Win Cash!',
    subtitle: 'India\'s most trusted ludo earning app',
    points: ['🏆 Win up to ₹5000 per game', '⚡ Instant UPI/Bank Withdrawal', '🎮 Play Now — Free to Join!'],
    bg: 'from-[#f7971e] via-[#d35400] to-[#7b241c]',
    accent: '#fff176',
  },
  {
    type: 'trust',
    title: '100% Secure & Trusted',
    subtitle: 'Your money is safe with us',
    points: ['🔒 SSL Encrypted Payments', '✅ Verified & Licensed Platform', '⚡ Instant Withdrawals 24/7'],
    bg: 'from-[#0f2027] via-[#203a43] to-[#2c5364]',
    accent: '#00e676',
  },
  {
    type: 'win',
    title: '🏆 Win Real Cash Daily',
    subtitle: 'Players winning ₹500–₹5000 every day',
    points: ['💸 Instant UPI & Bank Withdrawal', '🎯 Fair & Transparent Gameplay', '🤝 3% Referral Bonus on Every Game'],
    bg: 'from-[#200122] via-[#6f0000] to-[#200122]',
    accent: '#ffd700',
  },
];

const slideVariants = {
  enter: (dir) => ({ x: dir > 0 ? '100%' : '-100%', opacity: 0 }),
  center: { x: 0, opacity: 1, transition: { duration: 0.45, ease: 'easeInOut' } },
  exit: (dir) => ({ x: dir > 0 ? '-100%' : '100%', opacity: 0, transition: { duration: 0.35, ease: 'easeInOut' } }),
};

const Home = () => {
  const navigate = useNavigate();
  const [noticeText, setNoticeText] = useState('⚡ 5% Commission • 3% Referral • 24/7 Withdrawal • WhatsApp Support 📞');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState(1);
  const intervalRef = useRef(null);

  useEffect(() => {
    fetchNoticeText();
  }, []);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setDirection(1);
      setCurrentSlide((prev) => (prev + 1) % bannerSlides.length);
    }, 3500);
    return () => clearInterval(intervalRef.current);
  }, []);

  const goToSlide = (index) => {
    setDirection(index > currentSlide ? 1 : -1);
    setCurrentSlide(index);
    clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setDirection(1);
      setCurrentSlide((prev) => (prev + 1) % bannerSlides.length);
    }, 3500);
  };

  const fetchNoticeText = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/config/public/noticeBoard`);
      if (response.data.success && response.data.data.value) {
        setNoticeText(response.data.data.value);
      }
    } catch (error) {
      console.error('Failed to fetch notice text:', error);
    }
  };


  const slide = bannerSlides[currentSlide];

  return (
    <div className="min-h-screen bg-[#e8f5d0] pb-24">
      {/* Banner Carousel */}
      <div className="mb-4 relative overflow-hidden" style={{ aspectRatio: '2.5/1' }}>
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <motion.div
            key={currentSlide}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="absolute inset-0 w-full h-full"
          >
            {slide.type === 'image' ? (
              <img src={slide.src} alt={slide.alt} className="w-full h-full object-cover" />
            ) : (
              <div className={`w-full h-full bg-gradient-to-r ${slide.bg} flex flex-col justify-center px-5 py-3`}>
                <h2 className="font-black text-lg leading-tight mb-1" style={{ color: slide.accent }}>
                  {slide.title}
                </h2>
                <p className="text-white/70 text-xs mb-2">{slide.subtitle}</p>
                <ul className="space-y-0.5">
                  {slide.points.map((p, i) => (
                    <li key={i} className="text-white text-xs font-semibold">{p}</li>
                  ))}
                </ul>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Dot indicators */}
        <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5 z-10">
          {bannerSlides.map((_, i) => (
            <button
              key={i}
              onClick={() => goToSlide(i)}
              className={`rounded-full transition-all duration-300 ${
                i === currentSlide
                  ? 'bg-white w-5 h-2'
                  : 'bg-white/50 w-2 h-2'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Notice Board */}
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="mx-4 mb-4 bg-gradient-to-r from-green-600 to-green-700 rounded-2xl p-4 shadow-lg"
      >
        <p className="text-white text-sm font-semibold text-center leading-tight">
          {noticeText}
        </p>
      </motion.div>

      {/* Game Cards */}
      <div className="p-4 grid grid-cols-2 gap-4">
        {/* Ludo Card */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          onClick={() => navigate('/game-lobby')}
          className="relative bg-gradient-to-br from-orange-400 to-orange-600 rounded-3xl p-6 text-center shadow-lg cursor-pointer hover:scale-105 transition-all overflow-hidden"
        >
          <div className="mb-3">
            <img src="/logo.png" alt="Ludo" className="w-20 h-20 mx-auto object-contain" />
          </div>
          <h3 className="text-white font-black text-xl mb-0.5">LUDO</h3>
          <p className="text-white/90 font-bold text-sm">CLASSIC</p>
        </motion.div>

        {/* Snake & Ladder Card */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.15 }}
          onClick={() => navigate('/snake-ladder-lobby')}
          className="relative bg-gradient-to-br from-purple-500 to-indigo-700 rounded-3xl p-6 text-center shadow-lg cursor-pointer hover:scale-105 transition-all overflow-hidden"
        >
          <div className="mb-3">
            <div className="text-5xl mx-auto">🐍</div>
          </div>
          <h3 className="text-white font-black text-xl mb-0.5">SNAKE</h3>
          <p className="text-white/90 font-bold text-sm">& LADDER</p>
        </motion.div>
      </div>
    </div>
  );
};

export default Home;
