"use client";

import { ChangeEventHandler, MouseEventHandler } from "react";
import {
  Card,
  CardBody,
  Select,
  CardFooter,
  Text,
  Box,
  Button,
  VStack,
  Heading,
  CardHeader,
} from "@chakra-ui/react";
import { upperFirst } from "lodash-es";

export type MainMenuProps = {
  dict: Record<string, string>;
  apiType: string;
  apiTypes: string[];
  handleApiTypeChange: ChangeEventHandler<HTMLSelectElement>;
  mode: string;
  modes: string[];
  handleModeChange: ChangeEventHandler<HTMLSelectElement>;
  handleOnNewStory: MouseEventHandler<HTMLButtonElement>;
  handleOnContinueStory: MouseEventHandler<HTMLButtonElement>;
};

export function MainMenu(props: MainMenuProps) {
  return (
    <Card
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        transform: "translate(-50%, -50%)",
      }}
    >
      <CardHeader>
        <Heading size="md">{props.dict["title"]}</Heading>
      </CardHeader>
      <CardBody maxH="400px" overflow="auto" minW="320px">
        <Heading size="xs">{props.dict["select_api_type"]}</Heading>
        <Text
          style={{
            fontSize: "0.8rem",
            color: "grey",
            whiteSpace: "pre-line",
            marginTop: "0.5rem",
          }}
        >
          {props.dict["select_api_type_note"]}
        </Text>
        <Select
          mt={4}
          onChange={props.handleApiTypeChange}
          value={props.apiType}
        >
          {props.apiTypes.map((_apiType) => (
            <option key={_apiType} value={_apiType}>
              {upperFirst(props.dict[_apiType])}
            </option>
          ))}
        </Select>
        <Heading
          size="xs"
          style={{
            marginTop: "1rem",
          }}
        >
          {props.dict["select_mode"]}
        </Heading>
        <Text
          style={{
            fontSize: "0.8rem",
            color: "grey",
            whiteSpace: "pre-line",
            marginTop: "0.5rem",
          }}
        >
          {props.dict["select_mode_note"]}
        </Text>
        <Select mt={4} onChange={props.handleModeChange} value={props.mode}>
          {props.modes.map((_mode) => (
            <option key={_mode} value={_mode}>
              {upperFirst(props.dict[_mode])}
            </option>
          ))}
        </Select>
      </CardBody>
      <CardFooter>
        <VStack width="100%">
          <Button
            width="100%"
            colorScheme="teal"
            onClick={props.handleOnNewStory}
          >
            {props.dict["new_story"]}
          </Button>
          <Button width="100%" onClick={props.handleOnContinueStory}>
            {props.dict["load_story"]}
          </Button>
        </VStack>
      </CardFooter>
    </Card>
  );
}
