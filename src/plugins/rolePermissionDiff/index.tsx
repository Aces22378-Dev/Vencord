/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { openModal } from "@utils/modal";
import definePlugin from "@utils/types";
import { Role } from "@vencord/discord-types";
import {
    GuildRoleStore,
    Menu,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalRoot,
    Text,
    Button,
    React
} from "@webpack/common";

const PERMISSIONS = [
    ["Administrator", 1n << 3n],
    ["View Audit Log", 1n << 7n],
    ["View Server Insights", 1n << 19n],
    ["Manage Server", 1n << 5n],
    ["Manage Roles", 1n << 28n],
    ["Manage Channels", 1n << 4n],
    ["Manage Webhooks", 1n << 29n],
    ["Manage Guild Expressions", 1n << 30n],
    ["View Channels", 1n << 10n],
    ["Create Invite", 1n << 0n],
    ["Send Messages", 1n << 11n],
    ["Send Messages in Threads", 1n << 38n],
    ["Create Public Threads", 1n << 35n],
    ["Create Private Threads", 1n << 36n],
    ["Embed Links", 1n << 14n],
    ["Attach Files", 1n << 15n],
    ["Add Reactions", 1n << 6n],
    ["Use External Emojis", 1n << 18n],
    ["Use External Stickers", 1n << 37n],
    ["Mention Everyone", 1n << 17n],
    ["Manage Messages", 1n << 13n],
    ["Manage Threads", 1n << 34n],
    ["Read Message History", 1n << 16n],
    ["Send TTS Messages", 1n << 12n],
    ["Connect", 1n << 20n],
    ["Speak", 1n << 21n],
    ["Mute Members", 1n << 22n],
    ["Deafen Members", 1n << 23n],
    ["Move Members", 1n << 24n],
    ["Use Voice Activity", 1n << 25n],
    ["Priority Speaker", 1n << 8n],
    ["Stream", 1n << 9n],
    ["Use Application Commands", 1n << 31n],
    ["Request to Speak", 1n << 32n],
    ["Manage Events", 1n << 33n],
    ["Moderate Members", 1n << 40n],
    ["Use Soundboard", 1n << 42n],
    ["Use External Sounds", 1n << 45n],
    ["Send Voice Messages", 1n << 46n],
    ["Use Activities", 1n << 39n],
    ["Use Embedded Activities", 1n << 39n],
] as const;

function getPermissionValue(role: Role): bigint {
    return BigInt(role.permissions);
}

function getDifferences(first: Role, second: Role) {
    const firstPermissions = getPermissionValue(first);
    const secondPermissions = getPermissionValue(second);

    return PERMISSIONS
        .map(([name, bit]) => {
            const firstHas = (firstPermissions & bit) !== 0n;
            const secondHas = (secondPermissions & bit) !== 0n;

            if (firstHas === secondHas) return null;

            return {
                name,
                firstHas,
                secondHas
            };
        })
        .filter(Boolean);
}

function ComparisonModal({
    first,
    second,
    ...props
}: {
    first: Role;
    second: Role;
}) {
    const differences = getDifferences(first, second);

    return (
        <ModalRoot {...props} size="small">
            <ModalHeader>
                <Text variant="heading-lg/semibold">
                    {first.name} vs {second.name}
                </Text>
            </ModalHeader>

            <ModalContent>
                {differences.length === 0 ? (
                    <Text variant="text-md/normal">
                        These roles have no differences in the permissions checked by this plugin.
                    </Text>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "1fr 100px 100px",
                                fontWeight: 600
                            }}
                        >
                            <span>Permission</span>
                            <span>{first.name}</span>
                            <span>{second.name}</span>
                        </div>

                        {differences.map(permission => (
                            <div
                                key={permission.name}
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: "1fr 100px 100px",
                                    alignItems: "center"
                                }}
                            >
                                <Text variant="text-md/normal">
                                    {permission.name}
                                </Text>

                                <Text variant="text-md/normal">
                                    {permission.firstHas ? "✓" : "✗"}
                                </Text>

                                <Text variant="text-md/normal">
                                    {permission.secondHas ? "✓" : "✗"}
                                </Text>
                            </div>
                        ))}
                    </div>
                )}
            </ModalContent>

            <ModalFooter>
                <Button onClick={props.onClose}>
                    Close
                </Button>
            </ModalFooter>
        </ModalRoot>
    );
}

function RolePicker({
    guildId,
    firstRole,
    roles,
    onSelect,
    onClose,
    ...props
}: {
    guildId: string;
    firstRole: Role;
    roles: Role[];
    onSelect: (role: Role) => void;
}) {
    return (
        <ModalRoot {...props} size="small">
            <ModalHeader>
                <Text variant="heading-lg/semibold">
                    Compare {firstRole.name} with...
                </Text>
            </ModalHeader>

            <ModalContent>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {roles.map(role => (
                        <Button
                            key={role.id}
                            onClick={() => onSelect(role)}
                            look={Button.Looks.OUTLINED}
                        >
                            {role.name}
                        </Button>
                    ))}
                </div>
            </ModalContent>

            <ModalFooter>
                <Button onClick={onClose}>
                    Cancel
                </Button>
            </ModalFooter>
        </ModalRoot>
    );
}

function openRolePicker(guildId: string, firstRole: Role) {
    const roles = Object.values(GuildRoleStore.getRoles(guildId))
        .filter(role => role.id !== firstRole.id)
        .sort((a, b) => b.position - a.position);

    openModal(props => (
        <RolePicker
            {...props}
            guildId={guildId}
            firstRole={firstRole}
            roles={roles}
            onSelect={secondRole => {
                props.onClose();

                openModal(modalProps => (
                    <ComparisonModal
                        {...modalProps}
                        first={firstRole}
                        second={secondRole}
                    />
                ));
            }}
        />
    ));
}

export default definePlugin({
    name: "RolePermissionDiff",
    description: "Compare the permissions of two Discord roles.",
    authors: [
        {
            name: "Aces",
            id: 0
        }
    ],
    tags: ["Roles", "Utility"],

    contextMenus: {
        "dev-context"(children, { id }: { id: string }) {
            const guildId = DiscordNative?.app?.getGuildId?.() ?? "";

            if (!guildId) return;

            const role = GuildRoleStore.getRole(guildId, id);

            if (!role) return;

            children.push(
                <Menu.MenuItem
                    id="role-permission-diff"
                    label="Compare Permissions"
                    action={() => openRolePicker(guildId, role)}
                />
            );
        }
    }
});
