/* eslint-disable @next/next/no-img-element */
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import discord from 'discord.js';

import Navbar from '../../../components/navbar';
import SaveFooter from '../../../components/save-footer';

import { Container, Col, Row } from 'react-bootstrap';
import Head from 'next/head';
import Select from 'react-select';

import styles from '../../../assets/styles/dashboard/general.module.scss';
import { GetServerSideProps, NextPage } from 'next';

export const getServerSideProps: GetServerSideProps = async (context: any) => {
	if (context.req.user == undefined) {
		return {
			redirect: {
				destination: '/api/auth/loginRedirect',
				permanent: false,
			},
		};
	}

	const content = await axios({
		method: 'get',
		url: `${process.env.HOST_URL}/api/content/dashboard?page=general`,
		headers: context.req.headers,
	});

	const server = await axios({
		method: 'get',
		url: `${process.env.HOST_URL}/api/servers/info`,
		headers: context.req.headers,
		data: {
			user: context.req.user,
			server: context.req.url.split('/')[context.req.url.split('/').length - 3],
		},
	});

	return {
		props: {
			lang: content.data.lang,
			user: context.req.user,
			server: server.data,
		},
	};
};

let loadUsersTimer: any = null;
let loadChannelsTimer: any = null;
let loadRolesTimer: any = null;

const DashboardGeneral: NextPage = (props: any) => {
	const [selectOptions, setSelectOptions] = useState({
		users: {
			values: [],
			default: [],
			isLoading: false,
		},
		roles: {
			values: [],
			default: [],
			isLoading: false,
		},
		channels: {
			join: {
				values: [],
				default: '',
				isLoading: false,
			},
			exit: {
				values: [],
				default: '',
				isLoading: false,
			},
			mod: {
				values: [],
				default: '',
				isLoading: false,
			},
		},
	});

	const [config, setConfig] = useState(props.server.config);
	const [unsavedChanges, setUnsavedChanges] = useState(false);

	const loadUsers = (inputValue: string) => {
		if (!inputValue) return;
		if (props.server.info.owner !== props.user.id) return;

		clearTimeout(loadUsersTimer);
		setSelectOptions({
			...selectOptions,
			users: {
				...selectOptions.users,
				isLoading: true,
			},
		});

		loadUsersTimer = setTimeout(async () => {
			const response = await axios({
				method: 'post',
				url: `/api/users/search`,
				headers: {},
				data: {
					query: inputValue,
					server: props.server.info.id,
				},
			});

			let values = [];
			for (let i = 0; i < response.data.length; i++) {
				values.push({
					value: response.data[i].id,
					label: `${response.data[i].username}#${response.data[i].discriminator}`,
				});
			}

			setSelectOptions({
				...selectOptions,
				users: {
					...selectOptions.users,
					// @ts-ignore
					values: values,
					isLoading: false,
				},
			});
		}, 2000);
	};

	const loadChannels = (inputValue: string, option: any) => {
		if (!inputValue) return;

		clearTimeout(loadChannelsTimer);
		setSelectOptions({
			...selectOptions,
			channels: {
				...selectOptions.channels,
				[option]: {
					// @ts-ignore
					...selectOptions.channels[option],
					isLoading: true,
				},
			},
		});

		loadChannelsTimer = setTimeout(async () => {
			const response = await axios({
				method: 'post',
				url: `/api/channels/search`,
				headers: {},
				data: {
					query: inputValue,
					server: props.server.info.id,
				},
			});

			let values = response.data.map((channel: discord.GuildChannel) => {
				return {
					value: channel.id,
					label: `#${channel.name}`,
				};
			});

			setSelectOptions({
				...selectOptions,
				channels: {
					...selectOptions.channels,
					[option]: {
						// @ts-ignore
						...selectOptions.channels[option],
						values: values,
						isLoading: false,
					},
				},
			});
		}, 2000);
	};

	const loadRoles = (inputValue: string) => {
		if (!inputValue) return;

		clearTimeout(loadRolesTimer);
		setSelectOptions({
			...selectOptions,
			roles: {
				...selectOptions.roles,
				isLoading: true,
			},
		});

		loadRolesTimer = setTimeout(async () => {
			let response = await axios({
				method: 'post',
				url: `/api/roles/search`,
				headers: {},
				data: {
					query: inputValue,
					server: props.server.info.id,
				},
			});

			let values = response.data.map((role: discord.Role) => {
				return {
					value: role.id,
					label: role.name,
				};
			});

			setSelectOptions({
				...selectOptions,
				roles: {
					...selectOptions.roles,
					values: values,
					isLoading: false,
				},
			});
		}, 2000);
	};

	const selectStyles = {
		control: (base: any, _state: any) => ({
			...base,
			backgroundColor: '#1d2126',
			color: '#fff',
			border: 'none',
			width: '60%',
		}),
		option: (base: any, state: any) => ({
			...base,
			backgroundColor: state.isFocused ? '#1a1e24 ' : '#1d2126',
			color: '#FFF',
			transition: 'all 0.2s ease-in-out',
			padding: '10px',
		}),
		singleValue: (base: any, _state: any) => ({
			...base,
			color: '#FFF',
		}),
		placeholder: (base: any, state: any) => ({
			...base,
			color: state.isDisabled ? '#565656' : '#ccc',
		}),
		multiValue: (base: any, _state: any) => ({
			...base,
			color: '#FFF',
			backgroundColor: '#282c34',
		}),
		multiValueLabel: (base: any, _state: any) => ({
			...base,
			color: '#FFF',
		}),
		input: (base: any, _state: any) => ({
			...base,
			color: '#FFF',
		}),
		multiValueRemove: (base: any, _state: any) => ({
			...base,
			transition: 'all 0.2s ease-in-out',
			color: '#FFF',
			':hover': {
				color: '#FFF',
				backgroundColor: '#ef5859',
			},
			border: 'none',
		}),

		menu: (base: any, _state: any) => ({
			...base,
			width: '60%',
			backgroundColor: '#1a1e24',
		}),
	};

	const saveChanges = async () => {
		setUnsavedChanges(false);

		let response = await axios({
			method: 'post',
			url: `/api/servers/save-changes`,
			headers: {},
			data: {
				user: props.user.id,
				config: config,
				server: props.server.info.id,
			},
		});

		console.log(response.data);
	};

	window.onload = async () => {
		const trustedResult = await axios({
			method: 'post',
			url: `/api/users/getInfo`,
			headers: {},
			data: {
				users: props.server.config.Users.Trusted,
				server: props.server.info.id,
			},
		});

		setSelectOptions({
			...selectOptions,
			users: {
				...selectOptions.users,
				default: trustedResult.data,
			},
		});
	};

	useEffect(() => {
		const haveSameData = function (obj1: any, obj2: any) {
			const obj1Length = Object.keys(obj1).length;
			const obj2Length = Object.keys(obj2).length;

			if (obj1Length === obj2Length) {
				return Object.keys(obj1).every((key) => obj2.hasOwnProperty(key) && obj2[key] === obj1[key]);
			}
			return false;
		};

		if (haveSameData(config, props.server.config)) return setUnsavedChanges(false);
		setUnsavedChanges(true);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [config]);

	return (
		<div className={styles['dashboard-general']}>
			<Navbar usermenu='true' user={props.user} lang={props.lang.navbar} />
			<Head>
				<title>{props.lang.pageTitle}</title>
			</Head>

			<main>
				<Container fluid={true} className={styles['title']}>
					<img
						className={styles['return-button']}
						onClick={() => history.back()}
						width={40}
						src='/assets/images/return-button.svg'
						alt='Return Button'
					/>
					<p>{props.lang.title}</p>
				</Container>

				<Container fluid={true}>
					<Row>
						<Col>
							<h2>{props.lang.prefix}</h2>
							<input
								defaultValue={props.server.config.Prefix}
								type='text'
								onChange={(e) => {
									setConfig({
										...config,
										Prefix: e.target.value,
									});
								}}
							/>

							<br />
							<br />
							<br />
							<br />

							<h2>{props.lang.users.trusted}</h2>
							<Select
								isDisabled={props.server.info.owner !== props.user.id}
								options={selectOptions.users.values}
								onChange={(value) => {
									setConfig({
										...config,
										Users: {
											...config.Users,
											// @ts-ignore
											Trusted: value.map((v) => v.value),
										},
									});
								}}
								components={{
									NoOptionsMessage: () => null,
									ClearIndicator: () => null,
								}}
								isLoading={selectOptions.users.isLoading}
								isMulti={true}
								onInputChange={loadUsers}
								defaultValue={selectOptions.users.default}
								styles={selectStyles}
								placeholder={props.lang.select}
							/>

							<br />
							<br />
							<br />

							<h2>{props.lang.roles.muted}</h2>
							<Select
								styles={selectStyles}
								isLoading={selectOptions.roles.isLoading}
								defaultValue={selectOptions.roles.default}
								onInputChange={(e) => loadRoles(e)}
								components={{
									NoOptionsMessage: () => null,
									ClearIndicator: () => null,
								}}
								onChange={(value) => {
									setConfig({
										...config,
										Roles: {
											...config.Roles,
											// @ts-ignore
											MuteRol: value.value,
										},
									});
								}}
								placeholder={props.lang.select}
								options={selectOptions.roles.values}
							/>
						</Col>
						<Col>
							<h2>{props.lang.channels.join}</h2>
							<Select
								styles={selectStyles}
								isLoading={selectOptions.channels.join.isLoading}
								defaultValue={selectOptions.channels.join.default}
								onInputChange={(e) => loadChannels(e, 'join')}
								components={{
									NoOptionsMessage: () => null,
									ClearIndicator: () => null,
								}}
								onChange={(value) => {
									setConfig({
										...config,
										Channels: {
											...config.Channels,
											JoinLog: value,
										},
									});
								}}
								placeholder={props.lang.select}
								options={selectOptions.channels.join.values}
							/>

							<br />
							<br />
							<br />

							<h2>{props.lang.channels.exit}</h2>
							<Select
								styles={selectStyles}
								isLoading={selectOptions.channels.exit.isLoading}
								defaultValue={selectOptions.channels.exit.default}
								onInputChange={(e) => loadChannels(e, 'exit')}
								components={{
									NoOptionsMessage: () => null,
									ClearIndicator: () => null,
								}}
								onChange={(value) => {
									setConfig({
										...config,
										ExitLog: {
											...config.Channels,
											ExitLog: value,
										},
									});
								}}
								placeholder={props.lang.select}
								options={selectOptions.channels.exit.values}
							/>

							<br />
							<br />
							<br />

							<h2>{props.lang.channels.mod}</h2>
							<Select
								styles={selectStyles}
								isLoading={selectOptions.channels.mod.isLoading}
								defaultValue={selectOptions.channels.mod.default}
								onInputChange={(e) => loadChannels(e, 'mod')}
								components={{
									NoOptionsMessage: () => null,
									ClearIndicator: () => null,
								}}
								onChange={(value) => {
									setConfig({
										...config,
										ModLog: {
											...config.Channels,
											ModLog: value,
										},
									});
								}}
								placeholder={props.lang.select}
								options={selectOptions.channels.mod.values}
							/>
						</Col>
					</Row>
				</Container>
			</main>

			<footer>
				<SaveFooter open={unsavedChanges} reset={() => window.location.reload()} save={saveChanges} lang={props.lang.saveFooter} />
			</footer>
		</div>
	);
};

export default DashboardGeneral;
