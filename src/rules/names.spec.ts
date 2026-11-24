import {frameworkNameClashes} from "@rzymek/rally-the-troops-module/testing";
import {expect, it} from "vitest";

it("declares no top-level name that would replace one of the framework's (e.g. resume, finish)", () => {
  expect(frameworkNameClashes(new URL("./", import.meta.url).pathname)).toEqual([])
})
