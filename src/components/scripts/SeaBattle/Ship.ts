import SeaBattlePlayer from "./SeaBattlePlayer";

class Ship {
  size: number;
  placedBy: SeaBattlePlayer;
  hitPositions: Set<string> = new Set();
  isDestroyed: boolean = false;

  constructor(size: number, placedBy: SeaBattlePlayer) {
    this.size = size;
    this.placedBy = placedBy;
  }

  hit(key: string) {
    if (!this.hitPositions.has(key)) {
      this.hitPositions.add(key);
    }
    if (this.hitPositions.size >= this.size) {
      this.isDestroyed = true;
    }
  }
}

export default Ship;