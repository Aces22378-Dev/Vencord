/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { ContextMenuApi } from "@api/ContextMenu";
import { getCurrentGuild } from "@utils/discord";
import definePlugin from "@utils/types";
import type { Role } from "@vencord/discord-types";
import {
    GuildRoleStore,
    Menu,
    Modal,
    PermissionsBits,
    Text,
    Button
} from "@webpack/common";

function getDifferences(first: Role, second: Role) {
    const firstPermissions = BigInt(first.permissions);
    const secondPermissions = BigInt(second.permissions);

    return Object.values(PermissionsBits)
        .filter(bit => typeof bit === "bigint")
        .map(bit => {
            const firstHas = (firstPermissions & bit) === bit;
            const secondHas = (secondPermissions & bit) === bit;

            if (firstHas === secondHas)
                return null;

            return {
                bit,
                firstHas,
                secondHas
            };
        })
        .filter(Boolean);
}

function PermissionName({ bit }: { bit: bigint }) {
    return (
        <Text variant="text-md/normal">
            {String(bit)}
        </Text>
    );
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
        <Modal
            {...props}
            title={`${first.name} vs ${second.name}`}
            size="small"
        >
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                    padding: "16px"
                }}
            >
                {differences.length === 0 ? (
                    <Text variant="text-md/normal">
                        These roles have the same permissions.
                    </Text>
                ) : (
                    <>
                        <Text variant="text-md/normal">
                            {differences.length} permission
                            {differences.length === 1 ? "" : "s"} differ.
                        </Text>

                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "1fr 100px 100px",
                                gap: "8px",
                                maxHeight: "400px",
                                overflowY: "auto"
                            }}
                        >
                            <Text variant="text-md/semibold">
                                Permission
                            </Text>

                            <Text variant="text-md/semibold">
                                {first.name}
                            </Text>

                            <Text variant="text-md/semibold">
                                {second.name}
                            </Text>

                            {differences.map(permission => (
                                <React.Fragment key={String(permission!.bit)}>
                                    <PermissionName
                                        bit={permission!.bit}
                                    />

                                    <Text variant="text-md/normal">
                                        {permission!.firstHas
                                            ? "Allowed"
                                            : "Denied"}
                                    </Text>

                                    <Text variant="text-md/normal">
                                        {permission!.secondHas
                                            ? "Allowed"
                                            : "Denied"}
                                    </Text>
                                </React.Fragment>
                            ))}
                        </div>
                    </>
                )}

                <div
                    style={{
                        display: "flex",
                        justifyContent: "flex-end"
                    }}
                >
                    <Button onClick={props.onClose}>
                        Close
                    </Button>
                </div>
            </div>
        </Modal>
    );
}

function openComparison(first: Role, second: Role) {
    Modal.openModal(props => (
        <ComparisonModal
            {...props}
            first={first}
            second={second}
        />
    ));
}

function RolePicker({
    guildId,
    firstRole,
    ...props
}: {
    guildId: string;
    firstRole: Role;
}) {
    const roles = GuildRoleStore
        .getSortedRoles(guildId)
        .filter(role => role.id !== firstRole.id);

    return (
        <Modal
            {...props}
            title={`Compare ${firstRole.name} with...`}
            size="small"
        >
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                    padding: "16px",
                    maxHeight: "500px",
                    overflowY: "auto"
                }}
            >
                {roles.map(role => (
                    <Button
                        key={role.id}
                        look={Button.Looks.OUTLINED}
                        onClick={() => {
                            props.onClose();
                            openComparison(firstRole, role);
                        }}
                    >
                        {role.name}
                    </Button>
                ))}

                {roles.length === 0 && (
                    <Text variant="text-md/normal">
                        There are no other roles to compare.
                    </Text>
                )}
            </div>
        </Modal>
    );
}

function openRolePicker(guildId: string, role: Role) {
    Modal.openModal(props => (
        <RolePicker
            {...props}
            guildId={guildId}
            firstRole={role}
        />
    ));
}

export default definePlugin({
    name: "RolePermissionDiff",

    description: "Compare the permissions of two Discord roles.",

    authors: [
        {
            name: "Aces",
            id: 0n
        }
    ],

    tags: ["Roles", "Utility"],

    contextMenus: {
        "dev-context"(children, { id }: { id: string }) {
            const guild = getCurrentGuild();

            if (!guild)
                return;

            const role = GuildRoleStore.getRole(guild.id, id);

            if (!role)
                return;

            children.push(
                <Menu.MenuItem
                    id="role-permission-diff"
                    label="Compare Permissions"
                    action={() => {
                        ContextMenuApi.closeContextMenu();
                        openRolePicker(guild.id, role);
                    }}
                />
            );
        }
    }
});
