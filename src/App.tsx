import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { 
  ShoppingBag, User, LogOut, Star, ShoppingCart, PlusCircle, 
  Package, DollarSign, LayoutDashboard, Search, CheckCircle 
} from 'lucide-react';

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'home' | 'store' | 'about' | 'contact' | 'dashboard' | 'history'>('home');
  const [products, setProducts] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [authModal, setAuthModal] = useState<boolean>(false);
  const [isSignUp, setIsSignUp] = useState<boolean>(false);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [gcash, setGcash] = useState('');
  const [role, setRole] = useState<'buyer' | 'seller'>('buyer');

  // Product Posting Form
  const [newTitle, setNewTitle] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newImg, setNewImg] = useState('');

  // Histories
  const [boughtHistory, setBoughtHistory] = useState<any[]>([]);
  const [salesHistory, setSalesHistory] = useState<any[]>([]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      else setProfile(null);
    });

    fetchProducts();
  }, []);

  const fetchProfile = async (uid: string) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', uid).single();
    if (data) setProfile(data);
  };

  const fetchProducts = async () => {
    const { data } = await supabase.from('products').select('*, reviews(*)');
    if (data) setProducts(data);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSignUp) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName, gcash_number: gcash, role } }
      });
      if (error) alert(error.message);
      else alert('Registration successful! You can now log in.');
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) alert(error.message);
      else setAuthModal(false);
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session || profile?.role !== 'seller') return;

    const { error } = await supabase.from('products').insert({
      seller_id: session.user.id,
      title: newTitle,
      price: parseFloat(newPrice),
      description: newDesc,
      image_url: newImg || 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?auto=format&fit=crop&q=80&w=400'
    });

    if (error) alert(error.message);
    else {
      alert('Product created successfully!');
      setNewTitle(''); setNewPrice(''); setNewDesc(''); setNewImg('');
      fetchProducts();
    }
  };

  const handleCheckout = async () => {
    if (!session) {
      setAuthModal(true);
      return;
    }

    try {
      const res = await fetch('/api/paymongo-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart,
          buyerId: session.user.id,
          successUrl: window.location.origin + '?status=success',
          cancelUrl: window.location.origin + '?status=cancel'
        })
      });
      const data = await res.json();
      if (data.checkoutUrl) window.location.href = data.checkoutUrl;
      else alert('Payment initialization failed.');
    } catch (err) {
      alert('Error initiating checkout.');
    }
  };

  const submitReview = async (productId: string, rating: number, comment: string) => {
    if (!session) return alert('Log in to leave a review.');
    const { error } = await supabase.from('reviews').insert({
      product_id: productId,
      user_id: session.user.id,
      rating,
      comment
    });
    if (error) alert(error.message);
    else fetchProducts();
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-slate-50">
      {/* 1. HEADER & NAVIGATION */}
      <header className="sticky top-0 z-50 bg-slate-900 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('home')}>
            <ShoppingBag className="h-8 w-8 text-amber-500" />
            <span className="text-2xl font-bold tracking-tight">OfficeSupply<span className="text-amber-500">.Co</span></span>
          </div>

          <nav className="hidden md:flex space-x-8 text-sm font-medium">
            <button onClick={() => setActiveTab('home')} className={activeTab === 'home' ? 'text-amber-500' : 'hover:text-amber-400'}>Home</button>
            <button onClick={() => setActiveTab('store')} className={activeTab === 'store' ? 'text-amber-500' : 'hover:text-amber-400'}>Store Page</button>
            <button onClick={() => setActiveTab('about')} className={activeTab === 'about' ? 'text-amber-500' : 'hover:text-amber-400'}>About Us</button>
            <button onClick={() => setActiveTab('contact')} className={activeTab === 'contact' ? 'text-amber-500' : 'hover:text-amber-400'}>Contacts</button>
            {session && profile?.role === 'seller' && (
              <button onClick={() => setActiveTab('dashboard')} className={activeTab === 'dashboard' ? 'text-amber-500' : 'hover:text-amber-400'}>Seller Dashboard</button>
            )}
            {session && (
              <button onClick={() => setActiveTab('history')} className={activeTab === 'history' ? 'text-amber-500' : 'hover:text-amber-400'}>Order History</button>
            )}
          </nav>

          <div className="flex items-center space-x-4">
            <div className="relative cursor-pointer" onClick={() => setActiveTab('store')}>
              <ShoppingCart className="h-6 w-6 text-slate-300 hover:text-white" />
              {cart.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-amber-500 text-slate-900 text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {cart.length}
                </span>
              )}
            </div>

            {session ? (
              <div className="flex items-center space-x-3">
                <span className="text-xs bg-slate-800 border border-slate-700 px-3 py-1 rounded-full text-slate-300">
                  {profile?.full_name || session.user.email} ({profile?.role})
                </span>
                <button onClick={() => supabase.auth.signOut()} className="text-slate-400 hover:text-red-400">
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <button onClick={() => setAuthModal(true)} className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold px-4 py-2 rounded-md text-sm transition">
                Sign In / Register
              </button>
            )}
          </div>
        </div>
      </header>

      {/* BODY CONTENT ROUTING */}
      <main className="flex-grow">
        {/* HERO / HOME PAGE (Rule of Thirds, Contrast, Hierarchy) */}
        {activeTab === 'home' && (
          <div className="space-y-16 py-12">
            <section className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
              <div className="md:col-span-2 space-y-6">
                <h1 className="text-5xl font-extrabold text-slate-900 leading-tight">
                  Elevate Your Workspace with <span className="text-amber-500">Premium Office Gear</span>
                </h1>
                <p className="text-lg text-slate-600 max-w-xl">
                  From ergonomic designs to high-grade paper products, find everything you need to power your productivity daily.
                </p>
                <div className="flex space-x-4 pt-4">
                  <button onClick={() => setActiveTab('store')} className="bg-slate-900 text-white font-bold px-8 py-4 rounded-lg shadow-lg hover:bg-slate-800 transition">
                    Explore Store
                  </button>
                  <button onClick={() => setActiveTab('about')} className="border border-slate-300 font-bold px-8 py-4 rounded-lg hover:bg-slate-100 transition">
                    Learn More
                  </button>
                </div>
              </div>
              <div className="md:col-span-1 bg-amber-100 p-8 rounded-2xl border border-amber-200 text-center shadow-md">
                <Package className="h-16 w-16 text-amber-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-slate-900 mb-2">Sell On Our Platform</h3>
                <p className="text-sm text-slate-600 mb-6">Join hundreds of office suppliers today. Fast GCash payouts included.</p>
                <button onClick={() => setAuthModal(true)} className="w-full bg-amber-500 font-semibold text-slate-900 py-2 rounded-md hover:bg-amber-600">
                  Become a Seller
                </button>
              </div>
            </section>

            {/* FEATURES SECTION */}
            <section className="bg-slate-900 text-white py-16">
              <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="p-6 bg-slate-800 rounded-xl space-y-3">
                  <DollarSign className="h-10 w-10 text-amber-500" />
                  <h3 className="text-xl font-bold">GCash Integrated</h3>
                  <p className="text-slate-400 text-sm">Seamless native Philippine payments with immediate merchant payouts.</p>
                </div>
                <div className="p-6 bg-slate-800 rounded-xl space-y-3">
                  <CheckCircle className="h-10 w-10 text-amber-500" />
                  <h3 className="text-xl font-bold">Verified Ratings</h3>
                  <p className="text-slate-400 text-sm">Transparent product reviews and ratings directly from verified buyers.</p>
                </div>
                <div className="p-6 bg-slate-800 rounded-xl space-y-3">
                  <LayoutDashboard className="h-10 w-10 text-amber-500" />
                  <h3 className="text-xl font-bold">Seller Dashboard</h3>
                  <p className="text-slate-400 text-sm">Real-time tracking of sales history, inventory control, and customer logs.</p>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* STORE PAGE */}
        {activeTab === 'store' && (
          <div className="max-w-7xl mx-auto px-6 py-10">
            <h2 className="text-3xl font-bold mb-8">Store Catalog</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {products.map((product) => (
                <div key={product.id} className="bg-white border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition flex flex-col justify-between">
                  <img src={product.image_url} alt={product.title} className="h-48 w-full object-cover" />
                  <div className="p-6 space-y-3 flex-grow">
                    <h3 className="text-xl font-bold text-slate-900">{product.title}</h3>
                    <p className="text-slate-600 text-sm line-clamp-2">{product.description}</p>
                    <div className="text-2xl font-extrabold text-amber-600">₱{product.price.toFixed(2)}</div>
                  </div>
                  <div className="p-6 bg-slate-50 border-t space-y-3">
                    <button 
                      onClick={() => setCart([...cart, product])} 
                      className="w-full bg-slate-900 text-white font-semibold py-2 rounded-lg hover:bg-slate-800 transition flex items-center justify-center space-x-2">
                      <ShoppingCart className="h-4 w-4" />
                      <span>Add to Cart</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* CART CHECKOUT BAR */}
            {cart.length > 0 && (
              <div className="fixed bottom-6 right-6 bg-slate-900 text-white p-6 rounded-2xl shadow-2xl z-40 border border-slate-700 max-w-sm w-full">
                <h3 className="text-lg font-bold mb-2">Cart Summary ({cart.length} items)</h3>
                <p className="text-xl font-bold text-amber-500 mb-4">
                  Total: ₱{cart.reduce((sum, item) => sum + item.price, 0).toFixed(2)}
                </p>
                <button onClick={handleCheckout} className="w-full bg-amber-500 text-slate-900 font-bold py-3 rounded-xl hover:bg-amber-600 transition">
                  Pay via PayMongo / GCash
                </button>
              </div>
            )}
          </div>
        )}

        {/* SELLER DASHBOARD */}
        {activeTab === 'dashboard' && profile?.role === 'seller' && (
          <div className="max-w-7xl mx-auto px-6 py-10 space-y-10">
            <h2 className="text-3xl font-bold">Seller Dashboard</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <form onSubmit={handleAddProduct} className="bg-white p-6 border rounded-xl shadow-sm space-y-4">
                <h3 className="text-xl font-bold mb-4">Post New Product</h3>
                <input type="text" placeholder="Product Title" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} required className="w-full border p-3 rounded-lg" />
                <input type="number" placeholder="Price (PHP)" value={newPrice} onChange={(e) => setNewPrice(e.target.value)} required className="w-full border p-3 rounded-lg" />
                <input type="text" placeholder="Image URL" value={newImg} onChange={(e) => setNewImg(e.target.value)} className="w-full border p-3 rounded-lg" />
                <textarea placeholder="Description" value={newDesc} onChange={(e) => setNewDesc(e.target.value)} className="w-full border p-3 rounded-lg" />
                <button type="submit" className="w-full bg-amber-500 text-slate-900 font-bold py-3 rounded-lg">Publish Listing</button>
              </form>

              <div className="bg-white p-6 border rounded-xl shadow-sm">
                <h3 className="text-xl font-bold mb-4">Sales Analytics & History</h3>
                <p className="text-slate-500 text-sm">Real-time ledger connected to PayMongo Webhooks.</p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* AUTH MODAL */}
      {authModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-8 shadow-2xl relative">
            <h2 className="text-2xl font-bold mb-6">{isSignUp ? 'Create Account' : 'Sign In'}</h2>
            <form onSubmit={handleAuth} className="space-y-4">
              {isSignUp && (
                <>
                  <input type="text" placeholder="Full Name" value={fullName} onChange={(e) => setFullName(e.target.value)} required className="w-full border p-3 rounded-lg" />
                  <input type="text" placeholder="GCash Mobile Number" value={gcash} onChange={(e) => setGcash(e.target.value)} required className="w-full border p-3 rounded-lg" />
                  <select value={role} onChange={(e: any) => setRole(e.target.value)} className="w-full border p-3 rounded-lg">
                    <option value="buyer">Buyer Account</option>
                    <option value="seller">Seller Account</option>
                  </select>
                </>
              )}
              <input type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full border p-3 rounded-lg" />
              <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full border p-3 rounded-lg" />
              <button type="submit" className="w-full bg-slate-900 text-white font-bold py-3 rounded-lg">
                {isSignUp ? 'Register' : 'Sign In'}
              </button>
            </form>
            <button onClick={() => setIsSignUp(!isSignUp)} className="mt-4 text-sm text-amber-600 hover:underline w-full text-center block">
              {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Register"}
            </button>
            <button onClick={() => setAuthModal(false)} className="mt-2 text-xs text-slate-400 w-full text-center block">Cancel</button>
          </div>
        </div>
      )}

      {/* 4 & 5. SITEMAP & FOOTER */}
      <footer className="bg-slate-950 text-slate-400 py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          <div>
            <h4 className="text-white font-bold mb-4">OfficeSupply.Co</h4>
            <p className="text-sm">Your reliable hub for verified office tools and seamless GCash marketplace transactions.</p>
          </div>
          <div>
            <h5 className="text-white font-semibold mb-3">Sitemap</h5>
            <ul className="space-y-2 text-sm">
              <li><a href="#" onClick={() => setActiveTab('home')} className="hover:text-amber-500">Home</a></li>
              <li><a href="#" onClick={() => setActiveTab('store')} className="hover:text-amber-500">Store Page</a></li>
              <li><a href="#" onClick={() => setActiveTab('about')} className="hover:text-amber-500">About Us</a></li>
              <li><a href="#" onClick={() => setActiveTab('contact')} className="hover:text-amber-500">Contacts</a></li>
            </ul>
          </div>
          <div>
            <h5 className="text-white font-semibold mb-3">Legal & Safety</h5>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-amber-500">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-amber-500">Terms of Service</a></li>
              <li><a href="#" className="hover:text-amber-500">PayMongo Compliance</a></li>
            </ul>
          </div>
          <div>
            <h5 className="text-white font-semibold mb-3">Support</h5>
            <p className="text-sm">Use our Voiceflow AI Chatbot on the bottom right corner for 24/7 assistance.</p>
          </div>
        </div>
        <div className="text-center text-xs text-slate-600 border-t border-slate-900 pt-6">
          © {new Date().getFullYear()} OfficeSupply.Co. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
