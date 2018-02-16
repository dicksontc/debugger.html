/* eslint max-nested-callbacks: ["error", 4] */

import React from "react";
import { shallow, mount } from "enzyme";
import { ShortcutsModal } from "../ShortcutsModal";

jest.mock("fuzzaldrin-plus");

import { filter } from "fuzzaldrin-plus";

function generateModal(propOverrides, renderType = "shallow") {
  const props = {
    enabled: false,
    ...propOverrides
  };
  return {
    wrapper:
      renderType === "shallow"
        ? shallow(<ShortcutsModal {...props} />)
        : mount(<ShortcutsModal {...props} />),
    props
  };
}

describe("ShortcutsModal", () => {
  beforeEach(() => {
    filter.mockClear();
  });
  it("Doesn't render when disabled", () => {
    const { wrapper } = generateModal();
    expect(wrapper).toMatchSnapshot();
  });

  it("Renders when enabled", () => {
    const { wrapper } = generateModal({ enabled: true });
    expect(wrapper).toMatchSnapshot();
  });
});
