import storage from "../../common/storage-sync";
import React, { useState } from "react";

const App = (): JSX.Element => {
  const [user, setUser] = useState("");

  storage.get("username").then((response) => {
    setUser(response.username);
  });

  const malAuth = () => {
    chrome.runtime.sendMessage("mal-login", async (response) => {
      if (response) {
        const { username } = await storage.get("username");
        setUser(username);
      }
    });
  };

  const malLogout = () => {
    chrome.runtime.sendMessage("mal-logout", async (response) => {
      if (response) {
        setUser("");
      }
    });
  };

  return (
    <div className="content">
      <div className="title">Malgo</div>
      <div className="info">
        Integrate MyAnimeList anime data into Gogoanime website. Login with MAL account to also track and modify your
        list
      </div>
      {user && <div className="logged-msg">Logged in as {user}</div>}
      {!user ? (
        <button className="btn login-btn" onClick={malAuth}>
          Sign In
        </button>
      ) : (
        <button className="btn logout-btn" onClick={malLogout}>
          Sign out
        </button>
      )}
    </div>
  );
};

export default App;
