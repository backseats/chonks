import Body from "./Body";
import { useSetBodyIndexFunction } from "@/hooks/bodyHooks";
interface Props {
  chonkId: string;
  yourBodyIndex: number;
}

export default function BodySwitcher(props: Props) {
  const { chonkId, yourBodyIndex } = props;

  const { setBodyIndex } = useSetBodyIndexFunction();

  const colors = [
    '#EAD9D9',
    '#EFB25D',
    '#BA8136',
    '#8A5E24',
    '#493212'
  ];

  return (
    <div className="flex flex-row gap-2 mt-2">
      {colors.map((color, index) => (
        <div
          key={index}
          className={`w-8 h-8 cursor-pointer ${
            yourBodyIndex === index ? 'border-2 border-black/80' : ''
          }`}
          style={{ backgroundColor: color }}
          onClick={() => setBodyIndex(chonkId, index)}
        />
      ))}
    </div>
  )
}
