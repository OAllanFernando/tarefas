import React from "react";
import * as Style from "./styles";
import { createTask, deleteTask, findAllTask, getTaskByDay, getTaskByMonth, getTaskByTitle, getTaskByWeek, updateTask } from "../../services/task";
import useAuth from "../../hooks/useAuth";
import { format } from 'date-fns';
import Input from "../../components/Inputs";
import { createTag, deleteTag, findAllTag, findAllTagWithoutPages, updateTag } from "../../services/tag";
import getHolidays from "../../services/holidays";

const Index = () => {
    const { user } = useAuth();

    const [tasks, setTasks] = React.useState([]);
    const [tags, setTags] = React.useState([]);
    const [allTags, setAllTags] = React.useState([]);

    const [loading, setLoading] = React.useState(true);

    const [error, setError] = React.useState("");
    const [errorTag, setErrorTag] = React.useState("");
    const [errorCadTag, setErrorCadTag] = React.useState("");
    const [errorEdit, setErrorEdit] = React.useState("");

    const [isCadOpem, setIsCadOpem] = React.useState(false);
    const [isTagOpem, setIsTagOpem] = React.useState(false);
    const [isTagCadOpem, setIsTagCadOpem] = React.useState(false);

    const [flush, setFlush] = React.useState(0);
    const [search, setSearch] = React.useState("");
    const [exibition, setExibition] = React.useState(0);

    const [dateToFind, setDateToFind] = React.useState(null);

    const [holidays, setHolidays] = React.useState([]);
    const [holidaysText, setHolidaysText] = React.useState("");

    const [year, setYear] = React.useState(new Date().getFullYear());


    const [formData, setFormData] = React.useState({
        id: null,
        title: "",
        description: "",
        executionTime: "",
        durationMin: "",
        user: {
            id: user.id,
        },
        tags: [],
    });

    const [formDataTag, setFormDataTag] = React.useState({
        id: null,
        name: "",
        user: {
            id: user.id,
        }
    });


    const [page, setPage] = React.useState(0);
    const [pageSize, setPageSize] = React.useState(5);

    const [pageTag, setPageTag] = React.useState(0);
    const [pageSizeTag, setPageSizeTag] = React.useState(5);

    const [maxPage, setMaxPage] = React.useState(0);
    const [maxPageTag, setMaxPageTag] = React.useState(0);

    React.useEffect(() => {
        const fetchHoliday = async () => {
            const myHolidays = await getHolidays("BR", year);

            console.log(myHolidays, "ssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss");
            setHolidays(myHolidays);
        };
        fetchHoliday();
    }, [year]);

    React.useEffect(() => {
        const fetchDataTag = async () => {
            try {
                const myTags = await findAllTag(user.id, user.token, pageTag, pageSizeTag);
                const allMyTags = await findAllTagWithoutPages(user.id, user.token);
                if (myTags.length === 0 || myTags.data.length === 0) {
                    setErrorTag("Nenhuma tag cadastrada.");
                }
                if (allMyTags.length === 0 || allMyTags.data.length === 0) {
                    setErrorCadTag("Nenhuma tag cadastrada.");
                }
                setAllTags(allMyTags.data);
                setTags(myTags.data);
                setMaxPageTag(Math.ceil(myTags.totalCount / pageSizeTag) - 1);

            } catch (error) {

            }
        };
        fetchDataTag();
    }, [pageTag, pageSizeTag, maxPageTag, flush]);

    React.useEffect(() => {
        const fetchData = async () => {
            try {
                console.log("fetch data", dateToFind);
                setLoading(true);
                setError("");
                let mytasks;
                if (search !== "") {
                    // busca tarefas por nome
                    mytasks = await getTaskByTitle(user.id, search, user.token, page, pageSize);
                } else if (exibition === 0) {
                    // busca todas tarefa 
                    mytasks = await findAllTask(user.id, user.token, page, pageSize);
                } else if (exibition === 1) {
                    // busca por dia 
                    mytasks = await getTaskByDay(user.id, dateToFind, user.token, page, pageSize);
                }
                else if (exibition === 2) {
                    // busca por semana
                    mytasks = await getTaskByWeek(user.id, dateToFind, user.token, page, pageSize);
                }
                else if (exibition === 3) {
                    // busca por mês
                    mytasks = await getTaskByMonth(user.id, dateToFind, user.token, page, pageSize);
                }

                // Check if execution date is a holiday and mark tasks accordingly

                if (mytasks.length === 0 || mytasks.data.length === 0) {
                    setError("Nenhuma tarefa cadastrada.");
                } else {
                    const tasksWithHolidays = await Promise.all(mytasks.data.map(async (task) => {
                        const isHoliday = await handleCheckHolidayByDate(task.executionTime);
                        return { ...task, isHoliday };
                    }));

                    if (tasksWithHolidays.length === 0 || tasksWithHolidays.every(task => !task)) {
                        setError("Nenhuma tarefa cadastrada.");
                    }

                    setTasks(tasksWithHolidays);
                    setMaxPage(Math.ceil(mytasks.totalCount / pageSize) - 1);
                }


            } catch (error) {
                console.log(error);
                setError("Erro ao buscar tarefas.");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user, page, pageSize, maxPage, flush, search]);



    const handlePageSizeChange = (e) => {
        console.log(e.target.value);
        setPage(0)
        setPageSize(parseInt(e.target.value)); // Parse para garantir que é um número inteiro
    }

    const handlePageSizeTagChange = (e) => {
        console.log(e.target.value);
        setPageTag(0)
        setPageSizeTag(parseInt(e.target.value));
    }

    const handleExibitionChange = (e) => {
        console.log(e.target.value);
        setDateToFind(null)
        setExibition(parseInt(e.target.value))
        if (parseInt(e.target.value) === 0) {
            setFlush(flush + 1);
        }
    }

    const openModal = () => {
        setFormData({
            id: null,
            title: "",
            description: "",
            executionTime: "",
            durationMin: "",
            user: {
                id: user.id,
            },
            tags: [],
        });
        setHolidaysText("");
        setIsCadOpem(true);
    };

    const closeModal = () => {
        setIsCadOpem(false);
    };

    const openModalTag = () => {
        console.log("open modal");
        setIsTagOpem(true);
    };

    const openModalTagCad = () => {
        setFormDataTag({
            id: null,
            name: "",
            user: {
                id: user.id,
            }
        });
        setIsTagCadOpem(true);
    };

    const handleCheckHoliday = async (dateValue) => {
        const date = new Date(dateValue);
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        const dayOfWeek = date.getDay();
        const formatedDate = `${year}-${month}-${day}`;

        const holiday = await holidays.find(holiday => holiday.date === formatedDate);

        if (holiday) {
            setHolidaysText(`Feriado: ${holiday.localName}`);
        } else if (dayOfWeek === 0 || dayOfWeek === 6) {
            setHolidaysText("Fim de semana");
        } else {
            setHolidaysText("");
        }
    }

    const handleCheckHolidayByDate = async (dateValue) => {
        const date = new Date(dateValue);
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        const dayOfWeek = date.getDay();
        const formatedDate = `${year}-${month}-${day}`;

        const holiday = await holidays.find(holiday => holiday.date === formatedDate);
        if (holiday) {
            return `Feriado: ${holiday.localName}`;
        } else if (dayOfWeek === 0 || dayOfWeek === 6) {
            return "Fim de semana";
        } else {
            return "";
        }
    }


    const handleChange = (e) => {
        if (e.target.name === "executionTime") {
            handleCheckHoliday(e.target.value);
        }
        setErrorEdit("");
        setFormData({ ...formData, [e.target.name]: e.target.value });
    }

    const handleChangeTag = (e) => {
        console.log("change", e.target.name, e.target.value);
        setErrorEdit("");
        setFormDataTag({ ...formDataTag, [e.target.name]: e.target.value });
    }

    const handleChangeDateToFind = (e) => {
        setDateToFind(e.target.value);
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log("submit", formData);
        let response;
        if (formData.id) {
            response = await updateTask(formData, user.token);
        } else {
            response = await createTask(formData, user.token);
        }

        if (response !== 201 && response !== 200) {
            setErrorEdit("Erro ao salvar tarefa.");
            return;
        }

        closeModal();
        setFlush(flush + 1);
    }

    const handleSubmitTag = async (e) => {
        e.preventDefault();
        console.log("submit", formData);
        let response;
        if (formDataTag.id) {
            response = await updateTag(formDataTag, user.token);
        } else {
            response = await createTag(formDataTag, user.token);
        }
        if (response !== 201 && response !== 200) {
            setErrorEdit("Erro ao salvar tarefa.");
            return;
        }
        setIsTagCadOpem(false);
        setFlush(flush + 1);
    }

    const editTask = (task) => {
        setHolidaysText("");
        handleCheckHoliday(task.executionTime);
        const originalDateTime = new Date(task.executionTime);
        originalDateTime.setHours(originalDateTime.getHours() - 3);
        const formattedDateTime = originalDateTime.toISOString().slice(0, 16);

        const taskEdit = {
            id: task.id,
            title: task.title,
            description: task.description,
            executionTime: formattedDateTime,
            durationMin: task.durationMin,
            user: {
                id: user.id,
            },
            tags: task.tags,
        }
        setFormData(taskEdit);
        setIsCadOpem(true);
    }

    const deleteTaskAsk = async (task) => {
        console.log("delete", task);
        const ask = window.confirm("Deseja realmente excluir a tarefa?");
        //        console.log(ask);
        if (ask) {
            const response = await deleteTask(task.id, user.token);
            if (response !== 204) {
                setError("Erro ao excluir tarefa.");
                return;
            }
            setFlush(flush + 1);
        }

    }

    const editTag = (tag) => {
        //console.log("edit", tag);
        const tagEdit = {
            id: tag.id,
            name: tag.name,
            user: {
                id: user.id,
            }
        }
        setFormDataTag(tagEdit);
        setIsTagCadOpem(true);

    }

    const deleteTagAsk = async (tag) => {
        //console.log("delete", tag);
        const ask = window.confirm("Deseja realmente excluir a tarefa?");
        if (ask) {
            const response = await deleteTag(tag.id, user.token);
            if (response !== 204) {
                setErrorTag("Erro ao excluir Tag.");
                return;
            }
            setFlush(flush + 1);
        }

    }

    const handleSearch = async (e) => {
        e.preventDefault();
        setExibition(0);
        setDateToFind(null);
        setSearch(e.target.value)

    }

    const removeTag = (indexToRemove) => {
        const updatedTags = formData.tags.filter((tag, index) => index !== indexToRemove);
        setFormData(prevState => ({
            ...prevState,
            tags: updatedTags
        }));
    };

    // Função para lidar com a alteração da tag selecionada
    const handleTagChange = (e) => {
        const selectedTagId = e.target.value;
        const isTagAlreadySelected = formData.tags.some(tag => tag.id === selectedTagId);
        if (selectedTagId && !isTagAlreadySelected) {
            const selectedTagName = e.target.options[e.target.selectedIndex].text;
            setFormData(prevState => ({
                ...prevState,
                selectedTagId: selectedTagId,
                tags: [...prevState.tags, { id: selectedTagId, name: selectedTagName }]
            }));
        }
    };



    return (
        <Style.Container>
            <Style.Header>
                <Style.Label>Sistema de Cadastro de Tarefas</Style.Label>
                <Style.LabelMinor>
                    Desenvolvido por:{" "}
                    <Style.Strong>
                        <a
                            href="https://www.linkedin.com/in/allan-fernando-software-engineer/"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            Allan Fernando engenheiro de software
                        </a>
                    </Style.Strong>
                </Style.LabelMinor>
            </Style.Header>
            <Style.Body>

                <Style.BodyHeaderTag>
                    <Style.ButtonNewTags onClick={openModalTag}>Minhas Tags</Style.ButtonNewTags><Style.ButtonNewTags onClick={openModalTag}>Gráficos</Style.ButtonNewTags>
                </Style.BodyHeaderTag>
                {isTagOpem && (
                    <>
                        {isTagCadOpem && (
                            <Style.Content>
                                <Style.BodyHeaderLeft>
                                    <Style.Label>Cadastrar Tag</Style.Label>
                                </Style.BodyHeaderLeft>
                                <Style.LabelError>{errorCadTag}</Style.LabelError>
                                <Style.Form onSubmit={handleSubmitTag}>
                                    <Style.FormGroup>
                                        <label htmlFor="name">name:</label>
                                        <input type="text" id="name" name="name" value={formDataTag.name} onChange={handleChangeTag} />
                                    </Style.FormGroup>

                                    <Style.SubmitButton type="submit">Salvar</Style.SubmitButton>
                                </Style.Form>
                            </Style.Content>
                        )}
                        <Style.Content>
                            <Style.BodyHeader>
                                <Style.Label>Tags Cadastradas</Style.Label>&nbsp;<Style.BodyHeaderTag>
                                    <Style.ButtonNewTask onClick={openModalTagCad}>Cadastrar nova Tag</Style.ButtonNewTask><Style.DeleteButton onClick={() => { setIsTagOpem(false) }}>Fechar Tags</Style.DeleteButton>
                                </Style.BodyHeaderTag>
                            </Style.BodyHeader>


                            {loading ? (
                                <Style.Label>Loading...</Style.Label>
                            ) : errorTag ? (
                                <Style.LabelError>{errorTag}</Style.LabelError>
                            ) : (

                                <Style.Table>
                                    <thead>
                                        <tr>
                                            <th>Título</th>
                                            <th>Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {tags.map((task, index) => (
                                            <Style.TableRow key={index}>
                                                <Style.TableCell>
                                                    {task.name}
                                                </Style.TableCell>
                                                <Style.TableButtonCell>
                                                    <Style.EditButton onClick={() => { editTag(task); }}>Editar</Style.EditButton>
                                                    <Style.DeleteButton onClick={() => { deleteTagAsk(task); }}>Excluir</Style.DeleteButton>
                                                </Style.TableButtonCell>

                                            </Style.TableRow>
                                        ))}
                                        <div>
                                            <Style.Button disabled={pageTag <= 0 ? true : false} onClick={() => { setPageTag(pageTag - 1); }}>Página anterior</Style.Button>&nbsp;{pageTag}&nbsp;<Style.Button disabled={pageTag < maxPageTag ? false : true} onClick={() => { setPageTag(pageTag + 1); }}>Próxima página</Style.Button>
                                            <span> Página: </span>
                                            <select value={pageSizeTag} onChange={handlePageSizeTagChange}>
                                                <option value="5">5</option>
                                                <option value="10">10</option>
                                                <option value="15">15</option>
                                            </select>

                                        </div>
                                    </tbody>
                                </Style.Table>
                            )}
                        </Style.Content></>
                )}

                {isCadOpem && (
                    <Style.Content>
                        <Style.LabelError>{errorEdit}</Style.LabelError>
                        <Style.BodyHeader>
                            <Style.Label>Cadastrar Tarefa</Style.Label><Style.DeleteButton onClick={() => { setIsCadOpem(false) }}>Fechar Cadastro</Style.DeleteButton>
                        </Style.BodyHeader>
                        <Style.Form onSubmit={handleSubmit}>
                            <Style.FormGroup>
                                <label htmlFor="title">Título:</label>
                                <input type="text" id="title" name="title" value={formData.title} onChange={handleChange} />
                            </Style.FormGroup>
                            <Style.FormGroup>
                                <label htmlFor="description">Descrição:</label>
                                <textarea id="description" name="description" value={formData.description} onChange={handleChange} />
                            </Style.FormGroup>
                            <Style.FormGroup>
                                <label htmlFor="executionTime">Data/Hora:</label>
                                <input type="datetime-local" id="executionTime" name="executionTime" value={formData.executionTime} onChange={handleChange} />
                            </Style.FormGroup>
                            {
                                <Style.LabelSucess>{holidaysText}</Style.LabelSucess>
                            }
                            <Style.FormGroup>
                                <label htmlFor="durationMin">Duração (em minutos):</label>
                                <input type="number" id="durationMin" name="durationMin" value={formData.durationMin} onChange={handleChange} />
                            </Style.FormGroup>

                            <Style.FormGroup >
                                <label htmlFor="tags">Tags:</label>
                                <select value={formData.tags} onChange={handleTagChange}>
                                    <option value="">Selecione uma tag</option>
                                    {allTags && allTags.map((tag, index) => (
                                        <option value={tag.id}>{tag.name}</option>
                                    ))}
                                </select>
                            </Style.FormGroup>
                            {
                                <Style.TagsSpace>
                                    {
                                        formData.tags && formData.tags.map((tag, index) => (
                                            <Style.ButtonNewTags key={index} onClick={() => removeTag(index)} type="button">
                                                {tag.name}
                                            </Style.ButtonNewTags>
                                        ))
                                    }
                                </Style.TagsSpace>
                            }

                            <Style.BodyHeader> </Style.BodyHeader>
                            <Style.SubmitButton type="submit">Salvar</Style.SubmitButton>
                        </Style.Form>
                    </Style.Content>
                )}
                <Style.Content>

                    <Style.BodyHeader>
                        <Style.Label>Tarefas Cadastradas</Style.Label>&nbsp;<Style.ButtonNewTask onClick={openModal}>Cadastrar nova tarefa</Style.ButtonNewTask>
                    </Style.BodyHeader>
                    <Style.BodyHeader>
                        <Input
                            type="text"
                            placeholder="Pesquisar"
                            value={search}
                            onChange={handleSearch}
                        />

                        <span> Exibir por: </span>
                        <select value={exibition} onChange={handleExibitionChange}>
                            <option value="0">Todos</option>
                            <option value="1">Dia</option>
                            <option value="2">Semana</option>
                            <option value="3">Mês</option>
                        </select>
                        {
                            exibition === 1 ? <input type="date" id="day" name="day" value={dateToFind} onChange={handleChangeDateToFind} /> : exibition === 2 ? <input type="week" id="month" name="month" value={dateToFind} onChange={handleChangeDateToFind} /> : exibition === 3 ? <input type="month" id="month" name="month" value={dateToFind} onChange={handleChangeDateToFind} /> : ""
                        }
                        {
                            exibition === 1 || exibition === 2 || exibition === 3 ? <Style.Button disabled={dateToFind ? false : true} onClick={() => { setFlush(flush + 1) }}>Buscar</Style.Button> : null
                        }
                    </Style.BodyHeader>
                    {loading ? (
                        <Style.Label>Loading...</Style.Label>
                    ) : error ? (
                        <Style.LabelError>{error}</Style.LabelError>
                    ) : (
                        <Style.Table>
                            <thead>
                                <tr>
                                    <th>Título</th>
                                    <th>Descrição</th>
                                    <th>Data/Hora</th>
                                    <th>Duração</th>
                                    <th>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tasks.map((task, index) => {

                                    return (
                                        <Style.TableRow key={index}>
                                            <Style.TableCell>
                                                {task.title}
                                            </Style.TableCell>
                                            <Style.TableCell>
                                                {task.description}
                                            </Style.TableCell>
                                            <Style.TableCell>
                                                {format(new Date(task.executionTime), "dd/MM/yyyy HH:mm") + " " + task.isHoliday}
                                            </Style.TableCell>
                                            <Style.TableCell>
                                                {task.durationMin} Min
                                            </Style.TableCell>
                                            <Style.TableButtonCell>
                                                <Style.EditButton onClick={() => { editTask(task) }}>Editar</Style.EditButton>
                                                <Style.DeleteButton onClick={() => { deleteTaskAsk(task) }}>Excluir</Style.DeleteButton>
                                            </Style.TableButtonCell>
                                        </Style.TableRow>
                                    );
                                })}
                                <div>
                                    <Style.Button disabled={page <= 0 ? true : false} onClick={() => { setPage(page - 1) }}>Página anterior</Style.Button>&nbsp;{page}&nbsp;<Style.Button disabled={page < maxPage ? false : true} onClick={() => { setPage(page + 1) }}>Próxima página</Style.Button>
                                    <span> Página: </span>
                                    <select value={pageSize} onChange={handlePageSizeChange}>
                                        <option value="5">5</option>
                                        <option value="10">10</option>
                                        <option value="15">15</option>
                                    </select>

                                </div>
                            </tbody>
                        </Style.Table>
                    )}
                </Style.Content>
            </Style.Body>
            <Style.Footer>
                {/* Rodapé aqui */}
            </Style.Footer>
        </Style.Container>
    );
};

export default Index;
