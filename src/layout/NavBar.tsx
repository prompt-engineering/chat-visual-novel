import React from "react";
import {
  Box,
  Flex,
  Heading,
  IconButton,
  Link as NavLink,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Spacer,
} from "@/components/ChakraUI";
import {
  ChevronDownIcon,
  ExternalLinkIcon,
  HamburgerIcon,
} from "@/components/ChakraUI/icons";
import Link from "next/link";
import { GITHUB_URL } from "@/configs/constants";
import LocaleSwitcher from "@/components/LocaleSwitcher";
import { getAppData } from "@/i18n";

export default async function NavBar({ locale }: { locale: string }) {
  const { pathname } = await getAppData();

  const NavList = [
    {
      title: "Home",
      url: `/`,
    },
    {
      title: "ChatApp",
      url: `/chatgpt/`,
    },
  ];

  return (
    <Flex align="center" py="4" pl="20px" pr={{ md: "20px", base: "4px" }}>
      <Flex display={{ md: "block", base: "none" }}>
        <Heading size="md" mr={4}>
          <Link href={"/"}>ChatVisualNovel</Link>
        </Heading>
      </Flex>
      <Menu>
        <MenuButton
          as={IconButton}
          aria-label="Options"
          icon={<HamburgerIcon />}
          variant="outline"
          display={{ md: "none", base: "block" }}
          mr={4}
        />
        <MenuList display={{ md: "none", base: "block" }} color={"black"}>
          <MenuItem>
            <Heading size="md">
              <Link href={"/"}>ChatVisualNovel</Link>
            </Heading>
          </MenuItem>
          <MenuItem>
            <NavLink href={GITHUB_URL} isExternal>
              GitHub <ExternalLinkIcon mx="2px" />
            </NavLink>
          </MenuItem>
        </MenuList>
      </Menu>
      <Spacer />
      <LocaleSwitcher locale={locale} />
      <NavLink
        display={{ md: "block", base: "none" }}
        href={GITHUB_URL}
        isExternal
      >
        GitHub <ExternalLinkIcon mx="2px" />
      </NavLink>
    </Flex>
  );
}
