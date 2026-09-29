// ONLINE ROOM — the online connection and its create / join / room / seat-claim steps.
// Moved here from the old src/components/MainMenu.tsx (same rules, same room hook) so the room
// stays connected while its kit screen ('online', LobbyScreen.tsx) opens and closes, and during
// a game (Play Again comes back to the same room).
// Mounted once around the whole app in App.tsx; screens read it with useOnlineRoom().
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { screens, useScreens } from './kit'
import { useRoom } from '../hooks/useRoom'
import { useGameStore, PLAYER_COLORS } from '../store/gameStore'
import type { RoomPlayer } from '../types/protocol'
import { text } from './words'

// idle: not in a room (the create / join screen) · creating: host, in their room
// joining: sent a join, waiting · joined: in someone's room · claiming: game in progress, picking a seat
export type OnlineMode = 'idle' | 'creating' | 'joining' | 'joined' | 'claiming'

type OnlineRoom = {
  room: ReturnType<typeof useRoom>
  mode: OnlineMode
  create: () => void
  join: (code: string) => void
  start: () => void
  leave: () => void // leave the room and close the online screen
}

const RoomContext = createContext<OnlineRoom | null>(null)

export function useOnlineRoom() {
  const online = useContext(RoomContext)
  if (!online) throw new Error('useOnlineRoom needs <OnlineRoomProvider> around the app')
  return online
}

// A silly name for each player (the list lives in content/text/en.json → playerNames)
function getRandomName(): string {
  const names = text.playerNames
  return names[Math.floor(Math.random() * names.length)]
}

type ProviderProps = {
  onGameStart: (players: RoomPlayer[], targetPlayers: number, goalValues: number[], localPlayerId: string) => void
  children: ReactNode
}

export function OnlineRoomProvider({ onGameStart, children }: ProviderProps) {
  const room = useRoom()
  const [mode, setMode] = useState<OnlineMode>('idle')
  const onMenu = useGameStore((s) => s.screen) === 'menu'
  const onlineOpen = useScreens().includes('online')

  // --- Game start → the game (and the online screen closes) ---
  useEffect(() => {
    if (room.gameStartData && room.playerId) {
      onGameStart(room.gameStartData.players, room.gameStartData.targetPlayers, room.gameStartData.goalValues, room.playerId)
      while (screens.current.includes('online')) screens.pop()
    }
  }, [room.gameStartData, onGameStart, room.playerId])

  // --- joining → joined when connected as non-host (pre-game lobby only) ---
  // Needs room.status (from room_state) — mid-game joiners never get room_state,
  // so they stay 'joining' until seat_list arrives.
  useEffect(() => {
    if (mode === 'joining' && room.isConnected && room.roomCode && !room.isHost && room.status !== null) {
      setMode('joined')
    }
  }, [mode, room.isConnected, room.roomCode, room.isHost, room.status])

  // --- seat_list arrived → claiming (mid-game join, or a late Play Again) ---
  useEffect(() => {
    if (room.seatList !== null && mode !== 'claiming') setMode('claiming')
  }, [room.seatList, mode])

  // --- A join that failed (room full, not found…) or a room that went away → back to create / join ---
  useEffect(() => {
    if (!room.error) return
    if (mode === 'joining' || ((mode === 'creating' || mode === 'joined') && !room.roomCode)) setMode('idle')
  }, [room.error])

  // --- Back on the menu after a game with no connection → start fresh ---
  useEffect(() => {
    if (onMenu && !room.isConnected && mode !== 'idle') setMode('idle')
  }, [onMenu])

  // --- Play Again → the room again (the old "auto-detect lobby return") ---
  useEffect(() => {
    if (onMenu && room.isConnected && room.status === 'waiting' && room.players.length > 0 && mode === 'idle') {
      setMode(room.isHost ? 'creating' : 'joined')
    }
  }, [onMenu, room.isConnected, room.status, room.players.length, mode, room.isHost])

  const { leave: leaveRoom, clearConnectedElsewhere } = room
  const leave = useCallback(() => {
    leaveRoom()
    clearConnectedElsewhere()
    setMode('idle')
    while (screens.current.includes('online')) screens.pop()
  }, [leaveRoom, clearConnectedElsewhere])

  // --- The online screen follows the room: open while there's something to show on the menu;
  //     closing it (Leave, Back, Esc, tapping the dim) leaves the room ---
  const wasOpen = useRef(onlineOpen)
  useEffect(() => {
    const closedJustNow = wasOpen.current && !onlineOpen
    wasOpen.current = onlineOpen
    if (!onMenu) { // the game started (or a mid-game seat was taken): the online screen goes away
      while (onlineOpen && screens.current.includes('online')) screens.pop()
      return
    }
    if (closedJustNow) { leave(); return }
    if (!onlineOpen && (mode !== 'idle' || room.connectedElsewhere)) screens.push('online')
  }, [onlineOpen, onMenu, mode, room.connectedElsewhere, leave])

  // --- Actions (same as the old menu's) ---
  const create = () => {
    room.clearConnectedElsewhere()
    if (mode !== 'idle') room.leave()
    setMode('creating')
    room.createRoom(getRandomName(), PLAYER_COLORS[0])
  }

  const join = (code: string) => {
    room.clearConnectedElsewhere()
    if (mode === 'creating' || mode === 'joined' || mode === 'claiming') room.leave()
    setMode('joining')
    room.joinRoom(code.toUpperCase(), getRandomName(), PLAYER_COLORS[1])
  }

  // Host starts; empty seats are filled with bots up to 4
  const start = () => {
    const online = room.players.length
    room.startGame(online < 4 ? 4 : online)
  }

  return <RoomContext.Provider value={{ room, mode, create, join, start, leave }}>{children}</RoomContext.Provider>
}
