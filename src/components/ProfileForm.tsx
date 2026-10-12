
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import "./ProfileForm.css";

type Profile = {
  id: string;
  nickname: string;
  full_name: string;
  faculty: string;
  major: string;
  class_name: string;
  bio?: string;
};

type ProfileFormProps = {
  onSaved: (profile: Profile) => void;
};

export default function ProfileForm({ onSaved }: ProfileFormProps) {
  const [fullName, setFullName] = useState("");
  const [faculty, setFaculty] = useState("");
  const [major, setMajor] = useState("");
  const [className, setClassName] = useState("");
  const [nickname, setNickname] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadProfile() {
      const { data: authData, error: authError } =
        await supabase.auth.getUser();

      if (authError || !authData.user) {
        setMessage("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.");
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", authData.user.id)
        .maybeSingle();

      if (error) {
        setMessage("Không tải được hồ sơ: " + error.message);
      } else if (data) {
        setFullName(data.full_name ?? "");
        setFaculty(data.faculty ?? "");
        setMajor(data.major ?? "");
        setClassName(data.class_name ?? "");
        setNickname(data.nickname ?? "");
      } else {
        setNickname(authData.user.email?.split("@")[0] ?? "");
      }

      setLoading(false);
    }

    void loadProfile();
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");

    const values = {
      full_name: fullName.trim(),
      faculty: faculty.trim(),
      major: major.trim(),
      class_name: className.trim(),
      nickname: nickname.trim(),
    };

    if (Object.values(values).some((value) => !value)) {
      setMessage("Vui lòng điền đầy đủ tất cả thông tin.");
      return;
    }

    if (values.nickname.length < 3 || values.nickname.length > 24) {
      setMessage("Nickname phải có từ 3 đến 24 ký tự.");
      return;
    }

    setSaving(true);

    try {
      const { data: authData, error: authError } =
        await supabase.auth.getUser();

      if (authError || !authData.user) {
        throw new Error("Bạn cần đăng nhập lại.");
      }

      const profileData = {
        id: authData.user.id,
        ...values,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from("profiles")
        .upsert(profileData, { onConflict: "id" })
        .select("*")
        .single();

      if (error) throw error;

      onSaved(data as Profile);
    } catch (error) {
      const err = error as { message?: string; code?: string };

      if (err.code === "23505") {
        setMessage("Nickname này đã có người sử dụng. Hãy chọn tên khác.");
      } else {
        setMessage(err.message ?? "Không thể lưu hồ sơ.");
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="profile-loading">Đang tải hồ sơ...</div>;
  }

  return (
    <main className="profile-page">
      <form className="profile-card" onSubmit={handleSubmit}>
        <div className="profile-heading">
          <span className="profile-icon">🎓</span>
          <h1>Hoàn thiện hồ sơ</h1>
          <p>Thông tin của bạn trên HCMUS Connect</p>
        </div>

        <label>
          Họ và tên
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            maxLength={100}
            autoComplete="name"
            placeholder="Nguyễn Văn An"
            required
          />
        </label>

        <label>
          Khoa
          <input
            value={faculty}
            onChange={(e) => setFaculty(e.target.value)}
            maxLength={100}
            placeholder="Tên khoa"
            required
          />
        </label>

        <label>
          Ngành
          <input
            value={major}
            onChange={(e) => setMajor(e.target.value)}
            maxLength={100}
            placeholder="Tên ngành học"
            required
          />
        </label>

        <label>
          Lớp
          <input
            value={className}
            onChange={(e) => setClassName(e.target.value)}
            maxLength={50}
            placeholder="Mã lớp sinh viên"
            required
          />
        </label>

        <label>
          Nickname
          <input
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            minLength={3}
            maxLength={24}
            placeholder="Tên hiển thị trên cộng đồng"
            required
          />
        </label>

        {message && (
          <div className="profile-message" role="alert">
            {message}
          </div>
        )}

        <button className="profile-submit" type="submit" disabled={saving}>
          {saving ? "Đang lưu..." : "Lưu hồ sơ"}
        </button>

        <p className="profile-note">
          Chỉ nhập thông tin bạn muốn chia sẻ trong cộng đồng sinh viên.
        </p>
      </form>
    </main>
  );
}
