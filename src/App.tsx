import { useState } from "react";
import {
  createPlayer,
  rollDiceForTurn,
  hasLost,
  selectTargetOfCharacter,
  toggleDieLockForCharacter,
} from "../../Goodlock-back/src/domain/services/Player.service";
import {
  logGameState,
} from "../../Goodlock-back/src/domain/services/GameLoop.service"; import {
  createGameState,
  createTeamsFromTemplates,
  initializeEffects,
} from "../../Goodlock-back/src/domain/services/GameInit.service";
import { rollRandomPosition3 } from "../../Goodlock-back/src/domain/utils/Random.utils";
import {
  addAllEffectsToPriorityQueue,
  unstackPriorityQueue,
} from "../../Goodlock-back/src/domain/services/PriorityQueue.service";
import jasonTemplate from "../../Goodlock-back/tmplt/Jason.json";
import alicentTemplate from "../../Goodlock-back/tmplt/Alicent.json";
import robbertTemplate from "../../Goodlock-back/tmplt/Robbert.json";
import edwardTemplate from "../../Goodlock-back/tmplt/Edward.json";
import fionaTemplate from "../../Goodlock-back/tmplt/Fiona.json";
import georgeTemplate from "../../Goodlock-back/tmplt/George.json";
import GameState from "../../Goodlock-back/src/domain/types/GameState.type";
import PlayerIndex from "../../Goodlock-back/src/domain/types/PlayerIndex.type";
import CharacterIndex from "../../Goodlock-back/src/domain/types/CharacterIndex.type";
import { Player } from "../../Goodlock-back/src/domain/types/Player.type";

function App() {
  const [gameState, setGameState] = useState<GameState>(() => {
    initializeEffects();
    const team1 = createTeamsFromTemplates([
      JSON.stringify(jasonTemplate),
      JSON.stringify(alicentTemplate),
      JSON.stringify(robbertTemplate),
    ]);
    const team2 = createTeamsFromTemplates([
      JSON.stringify(edwardTemplate),
      JSON.stringify(fionaTemplate),
      JSON.stringify(georgeTemplate),
    ]);
    return createGameState(createPlayer(team1, 0), createPlayer(team2, 1),
    );
  });

  const rollAllDice = (): void => {
    const updatedPlayers = gameState.players.map(rollDiceForTurn) as [Player, Player];
    setGameState({
      ...gameState,
      players: updatedPlayers,
      rollsLeft: gameState.rollsLeft - 1,
    });
  };

  const toggleDieLock = (playerIndex: PlayerIndex, characterIndex: CharacterIndex): void => {
    const updatedPlayer = toggleDieLockForCharacter(
      gameState.players[playerIndex],
      { playerIndex, characterIndex }
    );
    setGameState({
      ...gameState,
      players: gameState.players.map((player, index) =>
        index === playerIndex ? updatedPlayer : player
      ) as [Player, Player],
    });
  };

  const assignTargets = (): void => {
    let player1 = gameState.players[0];
    let player2 = gameState.players[1];

    for (const c of player1.team) {
      player1 = selectTargetOfCharacter(player1, c.position.characterIndex, rollRandomPosition3(player2.playerIndex));
    }
    for (const c of player2.team) {
      player2 = selectTargetOfCharacter(player2, c.position.characterIndex, rollRandomPosition3(player1.playerIndex));
    }

    setGameState({
      ...gameState,
      players: [player1, player2],
    });
  };

  const resolveEffects = (state: GameState): GameState => {
    addAllEffectsToPriorityQueue(state);
    return unstackPriorityQueue(state);
  };

  const checkGameOver = (): string | null => {
    if (hasLost(gameState.players[0])) return "Player 2 Wins!";
    if (hasLost(gameState.players[1])) return "Player 1 Wins!";
    return null;
  };

  const nextRound = (): void => {
    const result = checkGameOver();
    if (result) {
      alert(result);
      return;
    }
    assignTargets();
    setGameState((prevState) => {
      logGameState(prevState);

      const updatedGameState = { ...resolveEffects(prevState), rollsLeft: 3, currentRound: prevState.currentRound + 1 };
      return updatedGameState;
    });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-r from-blue-500 to-purple-500 text-white">
      <h2 className="text-4xl font-bold mb-6">Round: {gameState.currentRound}</h2>
      <div className="grid grid-cols-2 gap-10">
        {gameState.players.map((player, playerIndex) => (
          <div
            key={playerIndex}
            className="bg-white text-black p-6 rounded-lg shadow-lg"
          >
            <h3 className="text-2xl font-semibold mb-4">
              Player {playerIndex + 1}
            </h3>
            {player.team.map((char, index) => (
              <div key={index} className="mb-4 border-b pb-2">
                <p className="font-medium">Name: {char.name}</p>
                <p>HP: {char.hp}</p>
                <p>Shield: {char.shield}</p>
                <p>Active Die Face: {char.face.description}</p>
                <button
                  onClick={() => toggleDieLock(playerIndex as PlayerIndex, index as CharacterIndex)}
                  className="mt-2 px-4 py-1 bg-gray-300 hover:bg-gray-400 text-black font-semibold rounded"
                >
                  {char.isFaceLocked ? "Unlock Die" : "Lock Die"}
                </button>
              </div>
            ))}
          </div>
        ))}
      </div>
      <div className="mt-8 flex space-x-4">
        <button
          onClick={rollAllDice}
          className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg shadow-md"
        >
          Roll Dice ({gameState.rollsLeft} left)
        </button>
        <button
          onClick={nextRound}
          className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg shadow-md"
        >
          Next Round
        </button>
      </div>
    </div>
  );
}

export default App;
