import { useEffect } from "react";
import { supabase } from "./lib/supabase";
import AuthForm from "./components/AuthForm";
import ProfileForm from "./components/ProfileForm";
import { useState } from "react";
import "./App.css";

type Tab =
  | "home"
  | "study"
  | "gaming"
  | "friends"
  | "messages"
  | "profile";

const posts = [
  {
    initials: "ML",
    name: "Minh Linh",
    major: "Khoa Công nghệ thông tin",
    time: "12 phút trước",
    tag: "Học nhóm",
    color: "lavender",
    title: "Tìm đồng đội ôn cấu trúc dữ liệu và giải thuật",
    body: "Mình đang ôn cây, đồ thị và quy hoạch động. Muốn tìm 2–3 bạn học cùng, mỗi tuần học vài buổi ở thư viện.",
    tags: ["DSA", "C++", "Học nhóm"],
    likes: 12,
    comments: 4,
  },
  {
    initials: "QH",
    name: "Quốc Huy",
    major: "Khoa Toán - Tin học",
    time: "35 phút trước",
    tag: "Gaming",
    color: "peach",
    title: "Tối nay có ai chơi Valorant không?",
    body: "Đang tìm vài người chơi vui vẻ sau giờ học. Không cần rank cao, giao tiếp thoải mái là được!",
    tags: ["Valorant", "Giải trí", "Buổi tối"],
    likes: 8,
    comments: 6,
  },
  {
    initials: "AT",
    name: "Anh Thư",
    major: "Khoa Vật lý - Vật lý kỹ thuật",
    time: "1 giờ trước",
    tag: "Kết bạn",
    color: "mint",
    title: "Tìm bạn cùng khám phá những điều mới",
    body: "Mình thích công nghệ, đọc sách và khám phá quán cà phê mới. Muốn kết nối thêm những người bạn có cùng sở thích.",
    tags: ["Công nghệ", "Đọc sách", "Cà phê"],
    likes: 15,
    comments: 3,
  },
];

const people = [
  {
    initials: "TN",
    name: "Thảo Nguyên",
    major: "Công nghệ thông tin",
    detail: "Đang học OOP, Python",
    color: "lavender",
    online: true,
  },
  {
    initials: "DK",
    name: "Đức Khánh",
    major: "Khoa học máy tính",
    detail: "Tìm team lập trình",
    color: "mint",
    online: true,
  },
  {
    initials: "MP",
    name: "Mai Phương",
    major: "Hệ thống thông tin",
    detail: "Thích đọc sách, UI/UX",
    color: "peach",
    online: false,
  },
];

const initialMessages = [
  { initials: "TN", name: "Thảo Nguyên", text: "Bạn có muốn học nhóm cuối tuần này không?", time: "10:42", color: "lavender" },
  { initials: "DK", name: "Đức Khánh", text: "Mình vừa tìm được tài liệu DSA hay lắm!", time: "09:18", color: "mint" },
  { initials: "MP", name: "Mai Phương", text: "Cảm ơn bạn nha 😊", time: "Hôm qua", color: "peach" },
];

function App() {
  const [activeTab, setActiveTab] = useState<Tab>("home");
  
const [session, setSession] = useState<any>(null);
const [authLoading, setAuthLoading] = useState(true);

const [profileComplete, setProfileComplete] = useState(false);
const [profileLoading, setProfileLoading] = useState(true);

const [search, setSearch] = useState("");
  const [postText, setPostText] = useState("");
  const [notice, setNotice] = useState("");
  const [likedPosts, setLikedPosts] = useState<number[]>([]);
  const [extraPosts, setExtraPosts] = useState<typeof posts>([]);
  const [chatText, setChatText] = useState("");
  const [chatMessages, setChatMessages] = useState<string[]>([]);
  const [activeChat, setActiveChat] = useState(0);
  const [nickname, setNickname] = useState("Sinh viên HCMUS");
  const [matching, setMatching] = useState(false);

useEffect(() => {
  let mounted = true;

  supabase.auth.getSession().then(({ data, error }) => {
    if (!mounted) return;

    if (error) {
      console.error("Không lấy được phiên đăng nhập:", error.message);
    }

    setSession(data.session);
    setAuthLoading(false);
  });

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, newSession) => {
    setSession(newSession);
    setAuthLoading(false);
  });

  return () => {
    mounted = false;
    subscription.unsubscribe();
  };
}, []);



useEffect(() => {
  if (!session?.user?.id) {
    setNickname("Sinh viên HCMUS");
    setProfileComplete(false);
    setProfileLoading(false);
    return;
  }

  let cancelled = false;

  async function loadProfile() {
    setProfileLoading(true);

    const { data, error } = await supabase
      .from("profiles")
      .select("nickname, full_name, faculty, major, class_name")
      .eq("id", session.user.id)
      .maybeSingle();

    if (cancelled) return;

    if (error) {
      console.error("Không tải được hồ sơ:", error.message);
      setProfileComplete(false);
      setProfileLoading(false);
      return;
    }

    const complete =
      !!data &&
      [
        data.nickname,
        data.full_name,
        data.faculty,
        data.major,
        data.class_name,
      ].every(
        (value) => typeof value === "string" && value.trim() !== "",
      );

    setProfileComplete(complete);

    if (data?.nickname) {
      setNickname(data.nickname);
    } else {
      setNickname(
        session.user.email?.split("@")[0] ?? "Sinh viên HCMUS",
      );
    }

    setProfileLoading(false);
  }

  void loadProfile();

  return () => {
    cancelled = true;
  };
}, [session?.user?.id]);


  const showNotice = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2800);
  };

  const goTo = (tab: Tab) => {
    setActiveTab(tab);
    setNotice("");
  };

  const allPosts = [...extraPosts, ...posts].filter((post) => {
    const query = search.toLowerCase().trim();
    return !query || `${post.name} ${post.title} ${post.body} ${post.tags.join(" ")}`.toLowerCase().includes(query);
  });

  const filteredPeople = people.filter((person) => {
    const query = search.toLowerCase().trim();
    return !query || `${person.name} ${person.major} ${person.detail}`.toLowerCase().includes(query);
  });

  const createPost = () => {
    if (!postText.trim()) {
      showNotice("Bạn hãy viết vài dòng trước khi đăng nhé.");
      return;
    }

    const newPost = {
      initials: "SV",
      name: nickname || "Sinh viên HCMUS",
      major: "Cộng đồng HCMUS",
      time: "Vừa xong",
      tag: "Chia sẻ",
      color: "lavender",
      title: postText.trim().slice(0, 72),
      body: postText.trim(),
      tags: ["Cộng đồng"],
      likes: 0,
      comments: 0,
    };

    setExtraPosts((current) => [newPost, ...current]);
    setPostText("");
    goTo("home");
    showNotice("Đã thêm bài đăng mẫu vào giao diện!");
  };

  const toggleLike = (index: number) => {
    setLikedPosts((current) =>
      current.includes(index)
        ? current.filter((item) => item !== index)
        : [...current, index],
    );
  };

  const sendMessage = () => {
    if (!chatText.trim()) return;
    setChatMessages((current) => [...current, chatText.trim()]);
    setChatText("");
  };

  const startMatching = () => {
    setMatching((current) => !current);
    showNotice(matching ? "Đã tạm dừng tìm kiếm." : "Đã bật trạng thái tìm bạn mẫu!");
  };

  if (authLoading) {
  return <div className="auth-loading">Đang kiểm tra đăng nhập...</div>;
}

if (!session) {
  return (
    <AuthForm
      onSuccess={() => {
        void supabase.auth.getSession().then(({ data }) => {
          setSession(data.session);
        });
      }}
    />
  );
}

if (profileLoading) {
  return (
    <div className="auth-loading">
      Đang kiểm tra hồ sơ của bạn...
    </div>
  );
}

if (!profileComplete) {
  return (
    <ProfileForm
      onSaved={(profile) => {
        setNickname(profile.nickname);
        setProfileComplete(true);
      }}
    />
  );
}

return (
  <div className="app-shell">
      <header className="topbar">
        <button className="brand" onClick={() => goTo("home")} aria-label="Về trang chủ">
          <span className="brand-mark">h</span>
          <span className="brand-name">hcmus<span>connect</span></span>
        </button>

        <label className="global-search">
          <span className="search-icon">⌕</span>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Tìm bài viết, bạn học, sở thích..."
            aria-label="Tìm kiếm"
          />
          <kbd>⌘ K</kbd>
        </label>

        <div className="top-actions">
          <button
  className="sign-out-button"
  onClick={async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      showNotice("Đăng xuất thất bại: " + error.message);
    }
  }}
>
  Đăng xuất
</button>
          <button className="icon-button notification-button" onClick={() => showNotice("Bạn chưa có thông báo mới.")} aria-label="Thông báo">
            ♧<span className="notification-dot" />
          </button>
          <button className="profile-chip" onClick={() => goTo("profile")}>
            <span className="avatar avatar-small avatar-lavender">SV</span>
            <span className="profile-chip-name">{nickname}</span>
            <span className="chevron">⌄</span>
          </button>
        </div>
      </header>

      <div className="workspace">
        <aside className="sidebar">
          <div className="sidebar-label">KHÔNG GIAN CỦA BẠN</div>
          <nav className="main-nav" aria-label="Điều hướng chính">
            <button className={activeTab === "home" ? "nav-item active" : "nav-item"} onClick={() => goTo("home")}>
              <span className="nav-icon">⌂</span> Bảng tin
            </button>
            <button className={activeTab === "study" ? "nav-item active" : "nav-item"} onClick={() => goTo("study")}>
              <span className="nav-icon">▤</span> Tìm bạn học <span className="nav-badge">Mới</span>
            </button>
            <button className={activeTab === "gaming" ? "nav-item active" : "nav-item"} onClick={() => goTo("gaming")}>
              <span className="nav-icon">♧</span> Đồng đội game
            </button>
            <button className={activeTab === "friends" ? "nav-item active" : "nav-item"} onClick={() => goTo("friends")}>
              <span className="nav-icon">♙</span> Khám phá bạn bè
            </button>
            <button className={activeTab === "messages" ? "nav-item active" : "nav-item"} onClick={() => goTo("messages")}>
              <span className="nav-icon">▱</span> Tin nhắn <span className="message-count">3</span>
            </button>
          </nav>

          <div className="sidebar-divider" />
          <div className="sidebar-label">CỘNG ĐỒNG CỦA BẠN</div>
          <button className="community-item" onClick={() => { setSearch("DSA"); goTo("home"); }}>
            <span className="community-icon community-purple">{"</>"}</span>
            <span><strong>Code Together</strong><small>1,2k thành viên</small></span>
          </button>
          <button className="community-item" onClick={() => { setSearch("Học nhóm"); goTo("home"); }}>
            <span className="community-icon community-orange">✳</span>
            <span><strong>Góc học tập</strong><small>856 thành viên</small></span>
          </button>
          <button className="community-item" onClick={() => { setSearch("Giải trí"); goTo("home"); }}>
            <span className="community-icon community-green">♡</span>
            <span><strong>After Class</strong><small>642 thành viên</small></span>
          </button>
          <button className="text-action" onClick={() => showNotice("Danh sách cộng đồng sẽ sớm được bổ sung.")}>＋ Khám phá cộng đồng</button>

          <div className="sidebar-bottom">
            <div className="mini-promo">
              <div className="promo-orb">✦</div>
              <strong>Đại học vui hơn<br />khi có bạn đồng hành.</strong>
              <p>Kết nối, chia sẻ và cùng nhau tiến bộ.</p>
              <button onClick={() => goTo("friends")}>Khám phá ngay <span>→</span></button>
            </div>
            <div className="sidebar-footer">© 2026 HCMUS Connect <span>·</span> <button onClick={() => showNotice("Bản demo giao diện.")}>Giới thiệu</button></div>
          </div>
        </aside>

        <main className="main-content">
          <div className="mobile-welcome">
            <span className="brand-mark">h</span>
            <strong>hcmus<span>connect</span></strong>
          </div>

          {activeTab === "home" && (
            <>
              <section className="welcome-section">
                <div>
                  <div className="eyebrow"><span className="eyebrow-dot" /> YOUR CAMPUS, YOUR PEOPLE</div>
                  <h1>Chào bạn, sinh viên! <span className="wave">✳</span></h1>
                  <p className="section-subtitle">Một người bạn phù hợp có thể làm cả học kỳ khác đi.</p>
                </div>
                <div className="welcome-art" aria-hidden="true">
                  <div className="art-circle art-circle-back" />
                  <div className="art-circle art-circle-front">✳</div>
                  <span className="art-star">✦</span>
                  <span className="art-sparkle">✧</span>
                </div>
              </section>

              <section className="quick-actions">
                <button className="quick-card quick-study" onClick={() => goTo("study")}>
                  <span className="quick-icon">▤</span>
                  <span className="quick-copy"><strong>Tìm bạn học</strong><small>Cùng nhau chinh phục môn khó</small></span>
                  <span className="quick-arrow">↗</span>
                </button>
                <button className="quick-card quick-game" onClick={() => goTo("gaming")}>
                  <span className="quick-icon">⌘</span>
                  <span className="quick-copy"><strong>Tìm đồng đội</strong><small>Thêm vui sau giờ học</small></span>
                  <span className="quick-arrow">↗</span>
                </button>
                <button className="quick-card quick-friend" onClick={() => goTo("friends")}>
                  <span className="quick-icon">♡</span>
                  <span className="quick-copy"><strong>Kết bạn mới</strong><small>Gặp người cùng tần số</small></span>
                  <span className="quick-arrow">↗</span>
                </button>
              </section>

              <div className="content-heading">
                <div><h2>Góc cộng đồng</h2><p>Những điều thú vị đang diễn ra quanh bạn</p></div>
                <button className="subtle-button" onClick={() => showNotice("Bạn đang xem các bài đăng mẫu.")}>Mới nhất <span>⌄</span></button>
              </div>

              <section className="post-composer">
                <div className="avatar avatar-lavender">SV</div>
                <div className="composer-main">
                  <textarea
                    value={postText}
                    onChange={(event) => setPostText(event.target.value)}
                    placeholder="Bạn đang nghĩ gì? Chia sẻ với cộng đồng..."
                    rows={2}
                  />
                  <div className="composer-bottom">
                    <div className="composer-tools">
                      <button onClick={() => goTo("study")}><span>▤</span> Học tập</button>
                      <button onClick={() => goTo("gaming")}><span>⌘</span> Gaming</button>
                      <button onClick={() => goTo("friends")}><span>♡</span> Kết bạn</button>
                    </div>
                    <button className="primary-button post-button" onClick={createPost}>Đăng bài <span>↗</span></button>
                  </div>
                </div>
              </section>

              <section className="feed-list">
                {allPosts.map((post, index) => (
                  <article className="post-card" key={`${post.name}-${post.title}-${index}`}>
                    <div className="post-top">
                      <div className={`avatar avatar-${post.color}`}>{post.initials}</div>
                      <div className="post-author"><strong>{post.name}</strong><span>{post.major} <i>·</i> {post.time}</span></div>
                      <button className="more-button" onClick={() => showNotice("Tùy chọn bài đăng mẫu.")} aria-label="Tùy chọn bài đăng">···</button>
                    </div>
                    <div className="post-category"><span className={`category-dot dot-${post.color}`} />{post.tag}</div>
                    <h3>{post.title}</h3>
                    <p className="post-body">{post.body}</p>
                    <div className="tag-list">{post.tags.map((tag) => <button key={tag} className="tag" onClick={() => setSearch(tag)}>{tag}</button>)}</div>
                    <div className="post-divider" />
                    <div className="post-actions">
                      <button className={likedPosts.includes(index) ? "post-action liked" : "post-action"} onClick={() => toggleLike(index)}>
                        <span>{likedPosts.includes(index) ? "♥" : "♡"}</span> {post.likes + (likedPosts.includes(index) ? 1 : 0)} thích
                      </button>
                      <button className="post-action" onClick={() => showNotice("Bình luận trực tuyến sẽ có khi kết nối backend.")}><span>▱</span> {post.comments} bình luận</button>
                      <button className="post-action post-share" onClick={() => showNotice("Chia sẻ sẽ được bổ sung sau.")}><span>↗</span> Chia sẻ</button>
                    </div>
                  </article>
                ))}
                {allPosts.length === 0 && <div className="empty-state"><span>⌕</span><h3>Chưa tìm thấy kết quả</h3><p>Thử một từ khóa khác nhé.</p><button className="subtle-button" onClick={() => setSearch("")}>Xóa tìm kiếm</button></div>}
              </section>
            </>
          )}

          {activeTab === "study" && (
            <section className="page-section">
              <div className="eyebrow"><span className="eyebrow-dot" /> LEARN TOGETHER</div>
              <h1>Tìm bạn học <span className="heading-emoji">✳</span></h1>
              <p className="section-subtitle">Tìm người cùng môn học, cùng mục tiêu và cùng tiến bộ.</p>
              <div className="feature-banner banner-study"><span className="feature-banner-icon">▤</span><div><strong>Học cùng nhau, đi xa hơn.</strong><p>Chia sẻ mục tiêu học tập và bắt đầu từ một buổi học nhỏ.</p></div></div>
              <div className="content-heading"><div><h2>Bài đăng học tập</h2><p>Những sinh viên đang tìm bạn đồng hành</p></div><button className="primary-button" onClick={() => { setPostText("Mình muốn tìm bạn học cùng môn "); goTo("home"); }}>＋ Tạo bài tìm bạn</button></div>
              <div className="feed-list">{allPosts.filter((post) => post.tag === "Học nhóm" || post.tags.some((tag) => ["DSA", "C++", "Học nhóm"].includes(tag))).map((post, i) => <article className="post-card" key={`${post.title}-${i}`}><div className="post-top"><div className={`avatar avatar-${post.color}`}>{post.initials}</div><div className="post-author"><strong>{post.name}</strong><span>{post.major} <i>·</i> {post.time}</span></div></div><div className="post-category"><span className="category-dot dot-lavender" />{post.tag}</div><h3>{post.title}</h3><p className="post-body">{post.body}</p><div className="tag-list">{post.tags.map((tag) => <span className="tag" key={tag}>{tag}</span>)}</div><button className="primary-button full-button" onClick={() => showNotice("Tính năng kết nối bạn học sẽ hoạt động khi có backend.")}>Kết nối bạn học ↗</button></article>)}</div>
            </section>
          )}

          {activeTab === "gaming" && (
            <section className="page-section">
              <div className="eyebrow"><span className="eyebrow-dot" /> PLAY TOGETHER</div>
              <h1>Tìm đồng đội <span className="heading-emoji">⌘</span></h1>
              <p className="section-subtitle">Hết giờ học, đến giờ chơi. Tìm team hợp cạ ngay trong trường.</p>
              <div className="feature-banner banner-game"><span className="feature-banner-icon">⌘</span><div><strong>Chơi vui, kết bạn thật.</strong><p>Tìm đồng đội cùng game, khung giờ và phong cách chơi.</p></div></div>
              <div className="game-grid">
                <button className="game-card" onClick={() => showNotice("Bạn đã chọn Valorant. Ghép đội thật cần backend.")}><span className="game-art game-art-v">V</span><strong>Valorant</strong><small>FPS · Đồng đội</small><span className="game-count">12 người đang tìm team</span><span className="game-join">Tìm đội ↗</span></button>
                <button className="game-card" onClick={() => showNotice("Bạn đã chọn League of Legends. Ghép đội thật cần backend.")}><span className="game-art game-art-l">L</span><strong>League of Legends</strong><small>MOBA · Chiến thuật</small><span className="game-count">8 người đang tìm team</span><span className="game-join">Tìm đội ↗</span></button>
                <button className="game-card" onClick={() => showNotice("Bạn đã chọn Minecraft. Tìm bạn thật cần backend.")}><span className="game-art game-art-m">M</span><strong>Minecraft</strong><small>Sandbox · Sáng tạo</small><span className="game-count">6 người đang tìm team</span><span className="game-join">Tìm đội ↗</span></button>
                <button className="game-card game-add" onClick={() => showNotice("Danh sách game có thể mở rộng sau.")}><span className="add-game-icon">＋</span><strong>Game của bạn?</strong><small>Khám phá thêm lựa chọn</small><span className="game-join">Xem thêm ↗</span></button>
              </div>
            </section>
          )}

          {activeTab === "friends" && (
            <section className="page-section">
              <div className="eyebrow"><span className="eyebrow-dot" /> MEET YOUR PEOPLE</div>
              <h1>Khám phá bạn bè <span className="heading-emoji">♡</span></h1>
              <p className="section-subtitle">Có nhiều người thú vị mà bạn chưa có dịp gặp.</p>
              <div className="match-panel"><div className="match-orb">✦</div><div className="match-copy"><strong>{matching ? "Bạn đang ở trạng thái tìm bạn" : "Sẵn sàng gặp người bạn mới?"}</strong><p>{matching ? "Đây chỉ là trạng thái mẫu trên giao diện này." : "Bật trạng thái để trải nghiệm giao diện tìm kiếm bạn đồng hành."}</p></div><button className={matching ? "secondary-button" : "primary-button"} onClick={startMatching}>{matching ? "Tạm dừng" : "Bắt đầu tìm"} <span>↗</span></button></div>
              <div className="content-heading"><div><h2>Có thể bạn sẽ hợp</h2><p>Một vài hồ sơ mẫu để khám phá</p></div><span className="result-count">{filteredPeople.length} hồ sơ</span></div>
              <div className="people-grid">{filteredPeople.map((person) => <article className="person-card" key={person.name}><div className="person-card-top"><div className={`avatar avatar-xl avatar-${person.color}`}>{person.initials}</div><span className={person.online ? "online-status" : "offline-status"}>{person.online ? "Đang hoạt động" : "Ngoại tuyến"}</span></div><h3>{person.name}</h3><p className="person-major">{person.major}</p><div className="person-interest">{person.detail}</div><button className="secondary-button person-connect" onClick={() => showNotice("Kết nối thật sẽ được bổ sung sau khi có tài khoản.")}>Gửi lời chào <span>↗</span></button></article>)}</div>
            </section>
          )}

          {activeTab === "messages" && (
            <section className="page-section">
              <div className="eyebrow"><span className="eyebrow-dot" /> YOUR CONVERSATIONS</div>
              <h1>Tin nhắn <span className="heading-emoji">▱</span></h1>
              <p className="section-subtitle">Một lời chào có thể bắt đầu một tình bạn.</p>
              <div className="chat-layout">
                <div className="chat-list"><div className="chat-list-heading">Cuộc trò chuyện <span>3</span></div>{initialMessages.map((message, index) => <button key={message.name} className={activeChat === index ? "chat-person active" : "chat-person"} onClick={() => { setActiveChat(index); setChatMessages([]); }}><div className={`avatar avatar-${message.color}`}>{message.initials}</div><div className="chat-person-info"><strong>{message.name}</strong><p>{message.text}</p></div><small>{message.time}</small></button>)}</div>
                <div className="chat-window"><div className="chat-header"><div className={`avatar avatar-${initialMessages[activeChat].color}`}>{initialMessages[activeChat].initials}</div><div><strong>{initialMessages[activeChat].name}</strong><span><i /> Cuộc trò chuyện mẫu</span></div><button className="more-button" onClick={() => showNotice("Tùy chọn trò chuyện mẫu.")}>···</button></div><div className="chat-body"><div className="chat-date">HÔM NAY</div><div className="chat-bubble received">{initialMessages[activeChat].text}<small>{initialMessages[activeChat].time}</small></div>{chatMessages.map((message, index) => <div className="chat-bubble sent" key={`${message}-${index}`}>{message}<small>Vừa xong</small></div>)}{chatMessages.length === 0 && <div className="chat-hint">Hãy gửi lời chào đầu tiên 👋</div>}</div><form className="chat-composer" onSubmit={(event) => { event.preventDefault(); sendMessage(); }}><input value={chatText} onChange={(event) => setChatText(event.target.value)} placeholder="Viết tin nhắn..." aria-label="Tin nhắn" /><button className="primary-button" type="submit">Gửi ↗</button></form></div>
              </div>
              <p className="demo-note">Tin nhắn ở đây chỉ lưu tạm trong phiên trình duyệt hiện tại, chưa được gửi đến người dùng khác.</p>
            </section>
          )}
          {activeTab === "profile" && (
  <section className="page-section">
    <ProfileForm
      onSaved={(profile) => {
        setNickname(profile.nickname);
        setProfileComplete(true);
        showNotice("Đã cập nhật hồ sơ thành công!");
        goTo("home");
      }}
    />
  </section>
)}
        </main>

        <aside className="rightbar">
          <section className="right-card campus-card">
            <div className="right-card-heading"><h3>Góc của bạn</h3><button onClick={() => showNotice("Thông tin mẫu của cộng đồng.")}>···</button></div>
            <div className="campus-cover"><span className="cover-star">✳</span><span className="cover-circle" /><span className="cover-caption">HCMUS<br />COMMUNITY</span></div>
            <div className="campus-stats"><div><strong>2.4k</strong><span>Thành viên</span></div><div><strong>186</strong><span>Đang online</span></div><div><strong>42</strong><span>Nhóm học</span></div></div>
            <button className="secondary-button full-button" onClick={() => showNotice("Thống kê cộng đồng là dữ liệu minh họa.")}>Khám phá cộng đồng ↗</button>
          </section>

          <section className="right-card people-card">
            <div className="right-card-heading"><h3>Bạn có thể biết</h3><button onClick={() => goTo("friends")}>Xem tất cả</button></div>
            {people.map((person) => <div className="suggested-person" key={person.name}><div className={`avatar avatar-${person.color}`}>{person.initials}</div><div className="suggested-info"><strong>{person.name}</strong><span>{person.major}</span></div><button className="add-person" onClick={() => showNotice(`Đã chọn ${person.name} (mẫu).`)} aria-label={`Kết nối ${person.name}`}>＋</button></div>)}
          </section>

          <section className="right-card community-tip">
            <span className="tip-icon">✦</span><div><strong>Một chút tích cực</strong><p>Hãy tử tế, tôn trọng sự khác biệt và giữ an toàn khi kết nối bạn mới.</p><button onClick={() => showNotice("Quy tắc cộng đồng sẽ được xây dựng trong giai đoạn tiếp theo.")}>Quy tắc cộng đồng ↗</button></div>
          </section>
          <div className="right-footer"><button onClick={() => showNotice("Chính sách bảo mật sẽ được bổ sung trước khi ra mắt.")}>Quyền riêng tư</button><span>·</span><button onClick={() => showNotice("Trợ giúp sẽ được bổ sung sau.")}>Trợ giúp</button><span>·</span><button onClick={() => showNotice("Đây là bản giao diện đang phát triển.")}>Phản hồi</button></div>
        </aside>
      </div>

      <nav className="mobile-nav" aria-label="Điều hướng di động">
        <button className={activeTab === "home" ? "mobile-nav-active" : ""} onClick={() => goTo("home")}><span>⌂</span>Trang chủ</button>
        <button className={activeTab === "study" ? "mobile-nav-active" : ""} onClick={() => goTo("study")}><span>▤</span>Bạn học</button>
        <button className={activeTab === "gaming" ? "mobile-nav-active" : ""} onClick={() => goTo("gaming")}><span>⌘</span>Gaming</button>
        <button className={activeTab === "friends" ? "mobile-nav-active" : ""} onClick={() => goTo("friends")}><span>♙</span>Bạn bè</button>
        <button className={activeTab === "messages" ? "mobile-nav-active" : ""} onClick={() => goTo("messages")}><span>▱</span>Tin nhắn</button>
      </nav>

      {notice && <div className="toast-message" role="status"><span>✓</span>{notice}</div>}
    </div>
  );
}

export default App;
