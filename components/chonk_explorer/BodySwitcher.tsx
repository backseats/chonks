import { useState } from "react";
import Body from "./Body";
import bodies from "../../contracts/csv-conversion/bodies.json";

interface Props {
  chonkId: string;
  yourBodyIndex: number;
}

export default function BodySwitcher(props: Props) {
  const { chonkId, yourBodyIndex } = props;

  return (
    <>
      {bodies.bodies.length > 0 ? (
        <>

            {bodies.bodies.map((body, index) => (
              <div key={index}>
              <Body
                key={index}
                chonkId={chonkId}
                  bodyId={body.id}
                  name={body.name}
                  path={body.path}
                  isSelected={yourBodyIndex === index}
                />
              </div>
            ))}

        </>
      ) : (
        <p className="text-lg">No Bodies to Display</p>
      )}
    </>
  );
}
