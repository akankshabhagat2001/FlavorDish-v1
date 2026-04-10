import React, { useState } from 'react';
import { formService } from '../services/formService';

// Wrapper for all static pages to share layout
const PageWrapper: React.FC<{ title: string; subtitle?: string; children: React.ReactNode }> = ({ title, subtitle, children }) => (
  <div className="min-h-[60vh] bg-gray-50 flex items-center justify-center p-6 mt-[60px]">
    <div className="bg-white max-w-4xl w-full rounded-[40px] shadow-sm border border-gray-100 p-12 text-center relative overflow-hidden">
      {/* Decorative gradient blob */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#EF4F5F]/10 to-transparent rounded-full blur-3xl -mr-20 -mt-20"></div>
      
      <div className="relative z-10">
        <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight mb-4">{title}</h1>
        {subtitle && <p className="text-gray-500 font-medium text-lg mb-8 max-w-2xl mx-auto">{subtitle}</p>}
        <div className="text-left text-gray-600 prose prose-gray mx-auto">
          {children}
        </div>
      </div>
    </div>
  </div>
);

export const AboutPage: React.FC = () => (
  <PageWrapper title="About Us">
    <div className="space-y-6 text-left max-w-2xl mx-auto">
      <p>FlavorFinder is a smart food discovery platform designed to help users explore the best restaurants, cafes, and local street food across cities like Ahmedabad.</p>
      <p>Our platform connects food lovers with hidden gems, trending eateries, and affordable local food options. Whether you're looking for a luxury dining experience or a street-side snack, FlavorFinder makes it easy with smart search, filters, and real-time location tracking.</p>
      <p>We aim to simplify food discovery and make every meal an experience.</p>
    </div>
  </PageWrapper>
);

export const ProjectDeckPage: React.FC = () => (
  <PageWrapper title="Project Deck">
    <div className="text-left max-w-2xl mx-auto space-y-6">
      <p>FlavorFinder is developed as a modern web application to solve the problem of discovering authentic and nearby food options.</p>
      <h3 className="font-bold text-gray-900 text-lg mt-6">Key Features:</h3>
      <ul className="list-disc pl-5 space-y-2">
        <li>Restaurant and street food discovery</li>
        <li>Google Maps integration</li>
        <li>User reviews and ratings</li>
        <li>Smart filters (price, rating, distance)</li>
        <li>Personalized recommendations</li>
      </ul>
      <h3 className="font-bold text-gray-900 text-lg mt-6">Technology Stack:</h3>
      <ul className="list-disc pl-5 space-y-2">
        <li>Frontend: React.js</li>
        <li>Backend: Node.js, Express</li>
        <li>Database: MongoDB</li>
      </ul>
      <h3 className="font-bold text-gray-900 text-lg mt-6">Future Scope:</h3>
      <ul className="list-disc pl-5 space-y-2">
        <li>AI-based food recommendations</li>
        <li>Online food ordering</li>
        <li>Delivery tracking system</li>
      </ul>
    </div>
  </PageWrapper>
);

export const TeamPage: React.FC = () => (
  <PageWrapper title="Who We Are">
    <div className="text-left max-w-2xl mx-auto space-y-6 mt-8">
      <p>We are a team of passionate developers from L.D. College of Engineering, Ahmedabad.</p>
      <h3 className="font-bold text-gray-900 text-lg mt-6">Team Members:</h3>
      <ul className="list-disc pl-5 space-y-2">
        <li>Akanksha Rajeshwar Bhagat</li>
        <li>[Add other members]</li>
      </ul>
      <p className="mt-6 font-medium">Our goal is to build innovative solutions that improve everyday experiences using technology.</p>
    </div>
  </PageWrapper>
);

export const BlogPage: React.FC = () => (
  <PageWrapper title="FlavorFinder Blog" subtitle="Discover the best food around you 🍽️">
    <div className="text-left max-w-2xl mx-auto space-y-6 mt-8">
      <h2 className="text-2xl font-black text-gray-900">Top 10 Street Foods in Ahmedabad You Must Try</h2>
      <p className="text-gray-600">Ahmedabad is a paradise for food lovers. From Manek Chowk’s midnight food market to Law Garden’s street stalls, the city offers a wide range of delicious options.</p>
      <h3 className="font-bold text-gray-900 text-lg mt-6">Popular items:</h3>
      <ul className="list-disc pl-5 space-y-2">
        <li>Pav Bhaji</li>
        <li>Dabeli</li>
        <li>Fafda Jalebi</li>
        <li>Chinese Bhel</li>
      </ul>
      <p className="mt-6 italic border-l-4 border-[#EF4F5F] pl-4">Explore these places using FlavorFinder and never miss a good meal!</p>
    </div>
  </PageWrapper>
);

export const CareersPage: React.FC = () => {
  const [showForm, setShowForm] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', email: '', resumeLink: '' });
  const [status, setStatus] = useState<string>('');

  const handleApply = async (role: string) => {
    try {
      setStatus('loading');
      await formService.submitJobApplication({ ...formData, role });
      setStatus('success');
      setFormData({ name: '', email: '', resumeLink: '' });
      setTimeout(() => { setStatus(''); setShowForm(null); }, 3000);
    } catch {
      setStatus('error');
    }
  };

  return (
    <PageWrapper title="Work With Us">
       <div className="text-left max-w-2xl mx-auto space-y-6 mt-8">
         <p>Join our team and be a part of the food-tech revolution.</p>
         <h3 className="font-bold text-gray-900 text-lg mt-6">Open Roles:</h3>
         <div className="space-y-4">
           {['Frontend Developer (React)', 'Backend Developer (Node.js)', 'UI/UX Designer'].map(role => (
             <div key={role} className="p-6 border border-gray-200 rounded-2xl">
               <div className="flex justify-between items-center mb-4">
                 <h4 className="font-bold text-gray-900">{role}</h4>
                 <button onClick={() => setShowForm(showForm === role ? null : role)} className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-bold">
                   {showForm === role ? 'Close' : 'Apply'}
                 </button>
               </div>
               {showForm === role && (
                 <div className="space-y-3 mt-4 pt-4 border-t border-gray-100">
                   <input className="w-full p-3 bg-gray-50 rounded-xl" placeholder="Your Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                   <input className="w-full p-3 bg-gray-50 rounded-xl" placeholder="Email Address" type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                   <input className="w-full p-3 bg-gray-50 rounded-xl" placeholder="Link to Resume/Portfolio" value={formData.resumeLink} onChange={e => setFormData({...formData, resumeLink: e.target.value})} />
                   <button onClick={() => handleApply(role)} disabled={status === 'loading'} className="w-full bg-[#EF4F5F] text-white p-3 rounded-xl font-bold">
                     {status === 'loading' ? 'Submitting...' : 'Submit Application'}
                   </button>
                   {status === 'success' && <p className="text-sm text-green-600 font-bold">Application submitted successfully!</p>}
                   {status === 'error' && <p className="text-sm text-red-600 font-bold">Failed to submit application. Please try again later.</p>}
                 </div>
               )}
             </div>
           ))}
         </div>
         <div className="mt-8 p-6 bg-gray-50 rounded-2xl border border-gray-100">
           <p className="font-bold text-gray-900">Send your resume to:</p>
           <a href="mailto:careers@flavorfinder.com" className="text-[#EF4F5F] hover:underline">careers@flavorfinder.com</a>
         </div>
       </div>
    </PageWrapper>
  );
};

export const InvestorPage: React.FC = () => (
  <PageWrapper title="Investor Relations" subtitle="Scaling the future of street food discovery.">
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
      <div className="bg-gray-50 p-6 rounded-2xl text-center">
        <div className="text-3xl font-black text-gray-900">5M+</div>
        <div className="text-xs text-gray-500 uppercase tracking-widest font-bold mt-2">Active Users</div>
      </div>
      <div className="bg-gray-50 p-6 rounded-2xl text-center">
        <div className="text-3xl font-black text-gray-900">50K+</div>
        <div className="text-xs text-gray-500 uppercase tracking-widest font-bold mt-2">Vendors</div>
      </div>
      <div className="bg-gray-50 p-6 rounded-2xl text-center">
        <div className="text-3xl font-black text-gray-900">₹2B</div>
        <div className="text-xs text-gray-500 uppercase tracking-widest font-bold mt-2">GMV (Demo)</div>
      </div>
      <div className="bg-gray-50 p-6 rounded-2xl text-center">
        <div className="text-3xl font-black text-gray-900">12</div>
        <div className="text-xs text-gray-500 uppercase tracking-widest font-bold mt-2">Cities</div>
      </div>
    </div>
  </PageWrapper>
);

export const ReportFraudPage: React.FC = () => {
  const [formData, setFormData] = useState({ reportType: 'Fake restaurants', details: '' });
  const [status, setStatus] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.reportType || !formData.details.trim()) {
      setErrorMessage('Please fill in all required fields');
      setStatus('error');
      setTimeout(() => setStatus(''), 4000);
      return;
    }

    try {
      setStatus('loading');
      setErrorMessage('');
      await formService.submitFraudReport({
        reportType: formData.reportType,
        details: formData.details,
        userId: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!)?._id : undefined
      });
      setStatus('success');
      setFormData({ reportType: 'Fake restaurants', details: '' });
      setTimeout(() => {
        setStatus('');
        setErrorMessage('');
      }, 3000);
    } catch (error: any) {
      console.error('Fraud report error:', error);
      setErrorMessage(error?.response?.data?.error || 'Failed to submit report. Please try again.');
      setStatus('error');
      setTimeout(() => setStatus(''), 4000);
    }
  };

  return (
    <PageWrapper title="Report Fraud">
      <div className="text-left max-w-2xl mx-auto space-y-6 mt-8">
        <p>Help us keep FlavorFinder safe and reliable.</p>
        <h3 className="font-bold text-gray-900 text-lg mt-6">Report:</h3>
        <ul className="list-disc pl-5 space-y-2">
          <li>Fake restaurants</li>
          <li>Incorrect location</li>
          <li>Fraudulent listings</li>
        </ul>
        <form onSubmit={handleSubmit} className="mt-8 bg-[#FFF4F5] border border-[#EF4F5F]/20 p-6 rounded-2xl space-y-4">
          <p className="text-[#EF4F5F] font-bold mb-4">Submit your report and our team will take action within 24 hours.</p>
          <select 
            value={formData.reportType} 
            onChange={e => setFormData({...formData, reportType: e.target.value})}
            required
            className="w-full bg-white border border-[#EF4F5F]/20 p-4 rounded-xl outline-none focus:border-[#EF4F5F]"
          >
            <option>Fake restaurants</option>
            <option>Incorrect location</option>
            <option>Fraudulent listings</option>
          </select>
          <textarea 
            placeholder="Describe the issue in detail..." 
            value={formData.details}
            onChange={e => setFormData({...formData, details: e.target.value})}
            required
            className="w-full bg-white border border-[#EF4F5F]/20 p-4 rounded-xl outline-none h-32 focus:border-[#EF4F5F]"
          />
          <button 
            type="submit" 
            disabled={status === 'loading' || !formData.details.trim()}
            className="w-full bg-[#EF4F5F] text-white font-black uppercase tracking-widest py-4 rounded-xl shadow-lg shadow-[#EF4F5F]/30 hover:disabled:opacity-50 hover:enabled:-translate-y-1 transition-transform disabled:cursor-not-allowed"
          >
            {status === 'loading' ? (
              <>
                <i className="fa-solid fa-spinner fa-spin mr-2"></i>
                Submitting...
              </>
            ) : (
              'Submit Report'
            )}
          </button>
          {status === 'success' && (
            <p className="text-center text-sm text-green-600 font-bold mt-2 flex items-center justify-center gap-2">
              <i className="fa-solid fa-check-circle"></i>
              Report submitted successfully! Our team will review it shortly.
            </p>
          )}
          {status === 'error' && (
            <div className="text-center text-sm text-red-600 font-bold mt-2 bg-red-50 p-3 rounded-lg">
              <i className="fa-solid fa-exclamation-circle mr-2"></i>
              {errorMessage || 'Failed to submit report. Please try again.'}
            </div>
          )}
        </form>
      </div>
    </PageWrapper>
  );
};

export const ContactPage: React.FC = () => {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', message: '' });
  const [status, setStatus] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      setErrorMessage('Please fill in all required fields (Name, Email, Message)');
      setStatus('error');
      setTimeout(() => setStatus(''), 4000);
      return;
    }

    try {
      setStatus('loading');
      setErrorMessage('');
      await formService.submitContactForm({
        name: formData.name,
        email: formData.email,
        phone: formData.phone || undefined,
        message: formData.message
      });
      setStatus('success');
      setFormData({ name: '', email: '', phone: '', message: '' });
      setTimeout(() => {
        setStatus('');
        setErrorMessage('');
      }, 3000);
    } catch (error: any) {
      console.error('Contact form error:', error);
      setErrorMessage(error?.response?.data?.error || 'Failed to send message. Please try again.');
      setStatus('error');
      setTimeout(() => setStatus(''), 4000);
    }
  };

  return (
    <PageWrapper title="Contact Us">
      <div className="text-left max-w-2xl mx-auto space-y-6 mt-8">
        <p>Have questions or feedback? We'd love to hear from you.</p>
        <div className="bg-gray-50 p-8 rounded-3xl space-y-4">
          <p><strong>Email:</strong> <a href="mailto:support@flavorfinder.com" className="text-[#EF4F5F] hover:underline">support@flavorfinder.com</a></p>
          <p><strong>Location:</strong> Ahmedabad, Gujarat</p>
          <p className="text-sm text-gray-500 mt-4">For urgent matters, please email us directly.</p>
        </div>
        <p className="italic text-center">Or fill out our contact form and we'll get back to you within 24 hours.</p>
        
        <form onSubmit={handleSubmit} className="space-y-4 bg-white border border-gray-200 p-8 rounded-3xl mt-4 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input 
              className="w-full p-4 bg-gray-50 rounded-xl outline-none focus:bg-white focus:border border-[#EF4F5F]/30 transition-colors" 
              required 
              placeholder="Your Name" 
              value={formData.name} 
              onChange={e => setFormData({...formData, name: e.target.value})} 
            />
            <input 
              className="w-full p-4 bg-gray-50 rounded-xl outline-none focus:bg-white focus:border border-[#EF4F5F]/30 transition-colors" 
              required 
              placeholder="Email Address" 
              type="email" 
              value={formData.email} 
              onChange={e => setFormData({...formData, email: e.target.value})} 
            />
          </div>
          <input 
            className="w-full p-4 bg-gray-50 rounded-xl outline-none focus:bg-white focus:border border-[#EF4F5F]/30 transition-colors" 
            placeholder="Phone Number (Optional)" 
            type="tel"
            value={formData.phone} 
            onChange={e => setFormData({...formData, phone: e.target.value})} 
          />
          <textarea 
            className="w-full p-4 bg-gray-50 rounded-xl outline-none focus:bg-white focus:border border-[#EF4F5F]/30 transition-colors h-32" 
            required 
            placeholder="Your Message" 
            value={formData.message} 
            onChange={e => setFormData({...formData, message: e.target.value})} 
          />
          <button 
            type="submit" 
            disabled={status === 'loading' || !formData.name.trim() || !formData.email.trim() || !formData.message.trim()}
            className="w-full bg-[#EF4F5F] text-white font-black uppercase tracking-widest py-4 rounded-xl shadow-lg shadow-[#EF4F5F]/30 hover:enabled:-translate-y-1 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {status === 'loading' ? (
              <>
                <i className="fa-solid fa-spinner fa-spin mr-2"></i>
                Sending Message...
              </>
            ) : (
              'Send Message'
            )}
          </button>
          {status === 'success' && (
            <p className="text-center text-sm text-green-600 font-bold mt-2 flex items-center justify-center gap-2">
              <i className="fa-solid fa-check-circle"></i>
              Message sent successfully! We'll get back to you soon.
            </p>
          )}
          {status === 'error' && (
            <div className="text-center text-sm text-red-600 font-bold mt-2 bg-red-50 p-3 rounded-lg">
              <i className="fa-solid fa-exclamation-circle mr-2"></i>
              {errorMessage || 'Failed to send message. Try sending an email directly instead.'}
            </div>
          )}
        </form>
      </div>
    </PageWrapper>
  );
};

// New Brand Ecosystem Pages
export const FeedingIndiaPage: React.FC = () => (
  <PageWrapper title="Feeding India" subtitle="Social impact by FlavorFinder.">
     <div className="text-center space-y-8 mt-8">
       <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-4xl mx-auto">
         <i className="fa-solid fa-hand-holding-heart"></i>
       </div>
       <p className="text-gray-600 max-w-lg mx-auto">Our NGO initiative aiming to reduce food waste and eradicate hunger in our cities by rescuing surplus food and delivering it to those in need.</p>
       <button className="bg-green-600 text-white px-8 py-3 rounded-full font-bold shadow-lg mt-4 inline-block">Volunteer Now</button>
     </div>
  </PageWrapper>
);

export const HyperpurePage: React.FC = () => (
  <PageWrapper title="Hyperpure" subtitle="B2B Supply for Restaurants.">
    <div className="text-center mt-8">
       <i className="fa-solid fa-truck-fast text-6xl text-blue-500 mb-6 block"></i>
       <p className="text-gray-600 max-w-lg mx-auto">Ensure the highest quality ingredients for your restaurant. Farm fresh, hygienic, and delivered directly to your kitchen.</p>
    </div>
  </PageWrapper>
);

export const FlavorlandPage: React.FC = () => (
  <PageWrapper title="Flavorland" subtitle="The fun side of food.">
    <div className="py-12 bg-purple-50 rounded-3xl mt-8 border border-purple-100 text-center">
       <h3 className="text-2xl font-black text-purple-900 mb-2">Food Festivals & Reels</h3>
       <p className="text-purple-700">Explore trending foods, local carnivals, and viral recipes.</p>
       <div className="mt-8 flex justify-center gap-4">
         <div className="w-32 h-48 bg-white rounded-xl shadow-sm border border-purple-100 flex items-center justify-center overflow-hidden">
            <span className="text-xs font-bold text-gray-400">Reel UI</span>
         </div>
         <div className="w-32 h-48 bg-white rounded-xl shadow-sm border border-purple-100 flex items-center justify-center overflow-hidden">
            <span className="text-xs font-bold text-gray-400">Reel UI</span>
         </div>
       </div>
    </div>
  </PageWrapper>
);

export const WeatherUnionPage: React.FC = () => (
  <PageWrapper title="Weather Union" subtitle="Smart food suggestions based on current weather.">
    <div className="grid grid-cols-2 gap-6 mt-8 max-w-lg mx-auto text-center">
      <div className="bg-blue-50 p-6 rounded-2xl flex flex-col items-center">
        <i className="fa-solid fa-cloud-rain text-4xl text-blue-400 mb-3"></i>
        <p className="font-bold text-gray-900">Raining</p>
        <p className="text-xs text-gray-500 mt-1">Chai & Pakoda</p>
      </div>
      <div className="bg-orange-50 p-6 rounded-2xl flex flex-col items-center">
        <i className="fa-solid fa-sun text-4xl text-orange-400 mb-3"></i>
        <p className="font-bold text-gray-900">Sunny</p>
        <p className="text-xs text-gray-500 mt-1">Cold Drinks & Ice Cream</p>
      </div>
    </div>
  </PageWrapper>
);

export const AppsPage: React.FC = () => (
  <PageWrapper title="Apps For You" subtitle="Take FlavorFinder everywhere.">
    <div className="flex justify-center gap-6 mt-12">
      <div className="bg-gray-900 text-white px-8 py-4 rounded-2xl flex items-center gap-4 cursor-pointer hover:-translate-y-1 transition-transform">
        <i className="fa-brands fa-apple text-3xl"></i>
        <div className="text-left">
          <p className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">Download on the</p>
          <p className="text-xl font-bold">App Store</p>
        </div>
      </div>
      <div className="bg-gray-900 text-white px-8 py-4 rounded-2xl flex items-center gap-4 cursor-pointer hover:-translate-y-1 transition-transform">
        <i className="fa-brands fa-google-play text-3xl"></i>
        <div className="text-left">
          <p className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">GET IT ON</p>
          <p className="text-xl font-bold">Google Play</p>
        </div>
      </div>
    </div>
  </PageWrapper>
);

export const EnterprisePage: React.FC = () => (
  <PageWrapper title="FlavorFinder Enterprise" subtitle="Corporate Food Solutions.">
    <div className="bg-gray-50 p-8 rounded-3xl mt-8">
      <i className="fa-solid fa-building text-4xl text-gray-400 mb-4 block text-center"></i>
      <h3 className="font-black text-gray-900 text-xl text-center">Advanced Business Solutions</h3>
      <ul className="text-gray-500 mt-4 text-left inline-block space-y-2">
        <li><i className="fa-solid fa-check text-green-500 mr-2"></i> Bulk food orders for events</li>
        <li><i className="fa-solid fa-check text-green-500 mr-2"></i> Office cafeteria catering</li>
        <li><i className="fa-solid fa-check text-green-500 mr-2"></i> API integration for your internal tools</li>
        <li><i className="fa-solid fa-check text-green-500 mr-2"></i> Custom data and analytics dashboards</li>
      </ul>
      <div className="mt-8 text-center">
        <button className="bg-gray-900 text-white px-6 py-3 rounded-xl font-bold">Contact Enterprise Sales</button>
      </div>
    </div>
  </PageWrapper>
);

export const PrivacyPage: React.FC = () => (
  <PageWrapper title="Privacy Policy">
    <div className="text-left max-w-2xl mx-auto space-y-6 mt-8">
      <p>We value your privacy. FlavorFinder collects minimal user data to improve your experience.</p>
      <p>We do not sell your personal data to third parties.</p>
    </div>
  </PageWrapper>
);

export const TermsPage: React.FC = () => (
  <PageWrapper title="Terms & Conditions">
    <div className="text-left max-w-2xl mx-auto space-y-6 mt-8">
      <p>By using FlavorFinder, you agree to our terms and conditions.</p>
      <p>Users must not post false reviews or misuse the platform.</p>
    </div>
  </PageWrapper>
);

export const SitemapPage: React.FC = () => (
  <PageWrapper title="Sitemap" subtitle="Navigate the FlavorFinder Ecosystem">
    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-left mt-8">
      <div>
        <h4 className="font-bold text-gray-900 mb-2 border-b pb-2">Main</h4>
        <ul className="space-y-2 text-sm text-gray-500">
          <li>Home</li>
          <li>Login</li>
          <li>Register</li>
        </ul>
      </div>
      <div>
        <h4 className="font-bold text-gray-900 mb-2 border-b pb-2">Company</h4>
        <ul className="space-y-2 text-sm text-gray-500">
          <li>About</li>
          <li>Careers</li>
          <li>Blog</li>
        </ul>
      </div>
      <div>
        <h4 className="font-bold text-gray-900 mb-2 border-b pb-2">Ecosystem</h4>
        <ul className="space-y-2 text-sm text-gray-500">
          <li>Feeding India</li>
          <li>Hyperpure</li>
          <li>Weather Union</li>
        </ul>
      </div>
      <div>
        <h4 className="font-bold text-gray-900 mb-2 border-b pb-2">Legal</h4>
        <ul className="space-y-2 text-sm text-gray-500">
          <li>Privacy</li>
          <li>Terms</li>
          <li>Report Fraud</li>
        </ul>
      </div>
    </div>
  </PageWrapper>
);

export const BlinkitPage: React.FC = () => (
  <PageWrapper title="Blinkit" subtitle="10 Minute Delivery Partner">
    <div className="bg-yellow-50 border-2 border-yellow-400 p-8 rounded-3xl mt-8 flex flex-col items-center">
      <div className="text-4xl font-black text-green-700 italic tracking-tighter mb-4">blinkit</div>
      <p className="text-gray-700 max-w-sm mb-6 text-center">Need groceries or rapid essentials? FlavorFinder partners with Blinkit for 10-minute deliveries straight to you.</p>
      <button className="bg-green-600 text-white font-bold py-3 px-8 rounded-xl shadow-lg border border-green-500">
        Order Groceries Now
      </button>
    </div>
  </PageWrapper>
);
