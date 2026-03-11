import React, { useState } from "react";

import LocalGame from "./tictactoe/LocalGame";
import OnlineGame from "./tictactoe/OnlineGame";
import styles from "./tictactoe/styles";
import type { Mode } from "./tictactoe/types";

// ─── Компонент ───────────────────────────────────────────────────────────────

const TicTacToe: React.FC = () => {
  const [mode, setMode]               = useState<Mode>("menu");
  const [onlineError, setOnlineError] = useState<string | null>(null);

  // ── Меню ──────────────────────────────────────────────────────────────────
  if (mode === "menu") {
    return (
      <div style={styles.container}>
        <h2 style={{ fontSize: 28, marginBottom: 8 }}>Крестики-нолики</h2>
        <p style={{ color: "#888", marginBottom: 24 }}>Выберите режим игры</p>

        {onlineError && (
          <div style={styles.errorBox}>
            ⚠️ {onlineError}
            <button onClick={() => setOnlineError(null)} style={styles.closeBtn}>×</button>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 12, width: 320 }}>
          {/* Два игрока */}
          <div style={styles.menuCard} onClick={() => setMode("local-pvp")}>
            <span style={styles.menuIcon}>👥</span>
            <div>
              <div style={styles.menuTitle}>Два игрока</div>
              <div style={styles.menuSub}>Играть вдвоём на одном устройстве</div>
            </div>
          </div>

          {/* Против компьютера */}
          <div style={styles.menuCard} onClick={() => setMode("local-bot")}>
            <span style={styles.menuIcon}>🤖</span>
            <div>
              <div style={styles.menuTitle}>Против компьютера</div>
              <div style={styles.menuSub}>Сыграть против бота (поле 3×3)</div>
            </div>
          </div>

          {/* Онлайн */}
          <div style={styles.menuCard} onClick={() => setMode("online")}>
            <span style={styles.menuIcon}>🌐</span>
            <div>
              <div style={styles.menuTitle}>Играть онлайн</div>
              <div style={styles.menuSub}>Найти соперника в интернете</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Локальная игра (PvP) ───────────────────────────────────────────────────
  if (mode === "local-pvp") {
    return <LocalGame mode="local-pvp" onExit={() => setMode("menu")} />;
  }

  // ── Локальная игра (vs Bot) ────────────────────────────────────────────────
  if (mode === "local-bot") {
    return <LocalGame mode="local-bot" onExit={() => setMode("menu")} />;
  }

  // ── Онлайн-игра ───────────────────────────────────────────────────────────
  return (
    <OnlineGame
      onExit={() => setMode("menu")}
      onError={(msg) => {
        setOnlineError(msg);
        setMode("menu");
      }}
    />
  );
};

export default TicTacToe;