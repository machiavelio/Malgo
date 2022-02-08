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
    <div>
      {user && <div>Hello {user}</div>}
      {!user ? <button onClick={malAuth}>MAL Auth</button> : <button onClick={malLogout}>Logout</button>}
    </div>
  );
};

export default App;
