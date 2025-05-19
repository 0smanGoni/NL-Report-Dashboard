import { useEffect, useState } from "react";
import axios from "axios";

export default function DBProfiles() {
  const [profiles, setProfiles] = useState([]);
  const [selectedProfileId, setSelectedProfileId] = useState(null);
  const [form, setForm] = useState({
    name: "",
    DB_HOST: "",
    DB_PORT: "",
    DB_USER: "",
    DB_PASSWORD: "",
    DB_NAME: "",
    ENGINE: "mysql", // ✅ New engine selector
    DEEPSEEK_API_KEY: ""
  });

  const fetchProfiles = async () => {
    const res = await axios.get("http://localhost:8000/profiles");
    setProfiles(res.data);
    if (res.data.length > 0 && !selectedProfileId) {
      setSelectedProfileId(res.data[0].id);
    }
  };

  const saveProfile = async () => {
    if (!form.name || !form.DB_NAME || !form.DB_USER || !form.DB_HOST) {
      alert("Please fill in all required fields.");
      return;
    }
    await axios.post("http://localhost:8000/profiles", form);
    fetchProfiles();
    setForm({
      name: "",
      DB_HOST: "",
      DB_PORT: "",
      DB_USER: "",
      DB_PASSWORD: "",
      DB_NAME: "",
      ENGINE: "mysql",
      DEEPSEEK_API_KEY: ""
    });
  };

  const deleteProfile = async (id) => {
    await axios.delete(`http://localhost:8000/profiles/${id}`);
    fetchProfiles();
  };

  const applyProfile = async () => {
    if (!selectedProfileId) return;
    try {
      await axios.post("http://localhost:8000/set-profile", { id: selectedProfileId });
      const profile = profiles.find(p => p.id === selectedProfileId);
      localStorage.setItem("db_config", JSON.stringify(profile));
      alert(`✔️ Applied profile: ${profile.name}`);
    } catch (err) {
      console.error("❌ Failed to apply profile:", err);
      alert("❌ Failed to apply profile. See console for details.");
    }
  };

  const testConnection = async () => {
    try {
      const res = await axios.get("http://localhost:8000/test-db-connection");
      alert(res.data.message || "Connection OK");
    } catch (err) {
      alert("❌ Connection test failed.");
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  return (
    <div style={{ marginBottom: "2rem" }}>
      <h3>📁 DB Profiles</h3>

      <div>
        <input name="name" placeholder="Profile Name" value={form.name} onChange={handleChange} />
        <input name="DB_HOST" placeholder="Host" value={form.DB_HOST} onChange={handleChange} />
        <input name="DB_PORT" placeholder="Port" value={form.DB_PORT} onChange={handleChange} />
        <input name="DB_USER" placeholder="User" value={form.DB_USER} onChange={handleChange} />
        <input name="DB_PASSWORD" type="password" placeholder="Password" value={form.DB_PASSWORD} onChange={handleChange} />
        <input name="DB_NAME" placeholder="Database" value={form.DB_NAME} onChange={handleChange} />

        {/* ✅ ENGINE SELECTOR */}
        <select name="ENGINE" value={form.ENGINE} onChange={handleChange} className="db-select">
          <option value="mysql">MySQL</option>
          <option value="mssql">MSSQL</option>
        </select>

        <input name="DEEPSEEK_API_KEY" placeholder="DeepSeek API Key" value={form.DEEPSEEK_API_KEY} onChange={handleChange} />
        
        <button className="btn-save2" onClick={saveProfile}>Save Profile</button>
      </div>

      <h4>🎯 Select Profile</h4>
      {profiles.length === 0 ? (
        <p>No profiles saved yet.</p>
      ) : (
        <>
          <div style={{ marginTop: "1rem" }}>
            <select
              value={selectedProfileId || ""}
              onChange={e => setSelectedProfileId(parseInt(e.target.value))}
              className="db-select"
            >
              {profiles.map(profile => (
                <option key={profile.id} value={profile.id}>
                  {profile.name} — {profile.DB_HOST}:{profile.DB_PORT}/{profile.DB_NAME}
                </option>
              ))}
            </select>

            <button onClick={applyProfile} className="btn-analyze">Apply</button>
            <button onClick={testConnection} className="btn-save">Test</button>
            <button onClick={() => deleteProfile(selectedProfileId)} className="btn-delete">Delete</button>
          </div>
        </>
      )}
    </div>
  );
}
