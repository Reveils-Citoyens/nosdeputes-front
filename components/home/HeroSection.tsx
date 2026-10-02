import React from "react";
import HeroFrame from "./HeroFrame";
import SearchBar from "./SearchBar";

export default function HeroSection() {
  return <HeroFrame searchContent={<SearchBar />} />;
}
