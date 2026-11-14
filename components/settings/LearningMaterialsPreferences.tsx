"use client";

import * as React from "react";

import { SettingsCheckboxList } from "@/components/settings/SettingsControls";
import { SettingsCard } from "@/components/settings/SettingsSection";
import { defaultMaterialTypes, materialTypes } from "@/lib/system-preferences";

/* PENDING-BACKEND: none of these preferences can be loaded or saved yet. */

/* The design repeats the material types under "File Upload Preferences", so
   both cards offer the same choices. */
const cards = [
  {
    id: "supported-material-types",
    title: "Supported Material Types",
    description:
      "Choose the types of learning materials instructors can upload and share.",
  },
  {
    id: "file-upload-preferences",
    title: "File Upload Preferences",
    description: "Set default requirements for uploaded learning materials.",
  },
];

export function LearningMaterialsPreferences(): React.JSX.Element {
  return (
    <>
      {cards.map((card) => (
        <MaterialTypesCard key={card.id} {...card} />
      ))}
    </>
  );
}

function MaterialTypesCard({
  id,
  title,
  description,
}: (typeof cards)[number]) {
  const [selected, setSelected] = React.useState(defaultMaterialTypes);

  return (
    <SettingsCard title={title} description={description} titleId={id}>
      <SettingsCheckboxList
        aria-labelledby={id}
        choices={materialTypes}
        value={selected}
        onChange={setSelected}
      />
    </SettingsCard>
  );
}
