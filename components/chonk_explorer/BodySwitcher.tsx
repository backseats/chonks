import { useState } from "react";
import Body from "./Body";
import bodies from "../../contracts/csv-conversion/bodies.json";

interface Props {
  chonkId: string;
  isYours: boolean;
  yourBodyIndex: number;
}

export default function BodySwitcher(props: Props) {
  const { chonkId, isYours, yourBodyIndex } = props;

  return (
    <div className="flex flex-col pt-4">
      {bodies.bodies.length > 0 ? (
        <>
          <div className="grid grid-cols-5 gap-4 mt-4">
            {bodies.bodies.map((body, index) => (
              <Body
                key={index}
                chonkId={chonkId}
                bodyId={body.id}
                name={body.name}
                path={body.path}
                isYours={isYours}
                isSelected={yourBodyIndex === index}
              />
            ))}
          </div>
        </>
      ) : (
        <p className="text-lg">No Bodies to Display</p>
      )}
    </div>
  );
}
