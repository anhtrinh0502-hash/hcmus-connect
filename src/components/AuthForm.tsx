
import { useState } from "react";
import { supabase } from "../lib/supabase";
import "./AuthForm.css";

type AuthFormProps = {
  onSuccess: () => void;
};

export default function AuthForm({ onSuccess }: AuthFormProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");

    if (!isLogin && nickname.trim().length < 3) {
      setMessage("Nickname phải có ít nhất 3 ký tự.");
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) throw error;

        onSuccess();
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
        });

        if (error) throw error;

        if (!data.user) {
          throw new Error("Không tạo được tài khoản. Hãy thử lại.");
        }

        // Nếu email confirmation đang bật, session có thể chưa tồn tại.
        if (!data.session) {
          setMessage(
            "Đăng ký thành công! Hãy kiểm tra email để xác nhận tài khoản, sau đó đăng nhập."
          );
          setIsLogin(true);
          return;
        }

        const { error: profileError } = await supabase
          .from("profiles")
          .insert({
            id: data.user.id,
            nickname: nickname.trim(),
          });

        if (profileError) {
          await supabase.auth.signOut();
          throw profileError;
        }

        onSuccess();
      }
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Đã xảy ra lỗi."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h1>HCMUS Connect</h1>
        <p>Kết nối bạn học, tìm đồng đội, mở rộng cộng đồng.</p>

        <div className="auth-tabs">
          <button
            type="button"
            className={isLogin ? "active" : ""}
            onClick={() => {
              setIsLogin(true);
              setMessage("");
            }}
          >
            Đăng nhập
          </button>

          <button
            type="button"
            className={!isLogin ? "active" : ""}
            onClick={() => {
              setIsLogin(false);
              setMessage("");
            }}
          >
            Đăng ký
          </button>
        </div>

        {!isLogin && (
          <label>
            Nickname
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              minLength={3}
              maxLength={24}
              autoComplete="nickname"
              placeholder="Ví dụ: studybuddy123"
              required
            />
          </label>
        )}

        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            placeholder="you@example.com"
            required
          />
        </label>

        <label>
          Mật khẩu
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
            autoComplete={isLogin ? "current-password" : "new-password"}
            placeholder="Ít nhất 6 ký tự"
            required
          />
        </label>

        {message && (
          <div className="auth-message" role="status">
            {message}
          </div>
        )}

        <button
          className="auth-submit"
          type="submit"
          disabled={loading}
        >
          {loading
            ? "Đang xử lý..."
            : isLogin
              ? "Đăng nhập"
              : "Tạo tài khoản"}
        </button>

        <small>
          Hãy dùng email và mật khẩu riêng cho HCMUS Connect, không dùng
          mật khẩu cổng thông tin sinh viên.
        </small>
      </form>
    </div>
  );
}
