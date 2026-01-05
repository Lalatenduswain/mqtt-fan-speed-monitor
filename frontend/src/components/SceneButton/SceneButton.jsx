import { useHome } from '../../context/HomeContext';
import './SceneButton.css';

const sceneIcons = {
  movie_night: '🎬',
  good_morning: '🌅',
  good_night: '🌙',
  all_off: '⏻',
  default: '▶️'
};

export default function SceneButton({ scene }) {
  const { executeScene } = useHome();

  const handleClick = () => {
    executeScene(scene.id);
  };

  return (
    <button className="scene-button" onClick={handleClick}>
      <span className="scene-icon">{sceneIcons[scene.id] || sceneIcons.default}</span>
      <span className="scene-name">{scene.name}</span>
    </button>
  );
}
