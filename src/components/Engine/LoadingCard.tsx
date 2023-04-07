"use client";

import { Cast } from "@/utils/types";
import {
  Card,
  CardHeader,
  Heading,
  CardBody,
  CardFooter,
  Text,
} from "@chakra-ui/react";
import { BeatLoader } from "react-spinners";
import { ClickPromptBird } from "../ClickPrompt/ClickPromptButton";

export type LoadingCardProps = {
  dict: Record<string, string>;
  cast: Cast;
};

export function LoadingCard(props: LoadingCardProps) {
  return (
    <Card
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        transform: "translate(-50%, -50%)",
        width: "300px",
      }}
    >
      <ClickPromptBird />
      <CardHeader textAlign="center">
        <Heading size="md">{props.dict["loading"]}</Heading>
      </CardHeader>
      <CardBody>
        <Text>
          {props.dict["cast_prefix"]}
          {props.cast.others.flatMap((val) => val.name).join(", ")}
          {props.dict["and"]}
          {props.cast.main.name}
          {props.dict["cast_suffix"]}
        </Text>
      </CardBody>
      <CardFooter>
        <BeatLoader style={{ margin: "0 auto" }} />
      </CardFooter>
    </Card>
  );
}
