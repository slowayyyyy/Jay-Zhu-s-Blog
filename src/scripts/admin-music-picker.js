import { musicLibrary } from '../lib/music-library.mjs';
import azureContent from '../data/azure-content.json';

const unwrap = value => value?.toJS?.() ?? value;
const choices = () => window.__JAY_MUSIC_TRACKS__ || musicLibrary(azureContent.playlist);
export function setupMusicPicker() {
  const { h, createClass, CMS } = window;
  if (!CMS) return;
  const Control = createClass({
    getInitialState() { return {query:'',tracks:choices(),error:''}; },
    componentDidMount() {
      this.alive=true;
      this.onTracks=()=>this.setState({tracks:choices()});
      window.addEventListener('jay:music-library',this.onTracks);
    },
    componentWillUnmount() { this.alive=false;window.removeEventListener('jay:music-library',this.onTracks); },
    async refresh() {
      try {
        const response=await fetch('/music/library.json?refresh='+Date.now(),{cache:'no-store'});
        if (!response.ok) throw new Error('fetch');
        const tracks=await response.json();
        if (!this.alive) return;
        window.__JAY_MUSIC_TRACKS__=tracks;
        this.setState({tracks,error:''});
      } catch {
        if(this.alive)this.setState({error:'暂时无法刷新。已选歌曲不会被删除；新音乐发布完成后可重试。'});
      }
    },
    render() {
      const multiple=this.props.field?.get?.('multiple') !== false;
      const raw=unwrap(this.props.value);
      const selected=multiple ? (Array.isArray(raw)?raw:[]) : (raw?[raw]:[]);
      const change=id=>this.props.onChange(multiple ? (selected.includes(id)?selected.filter(value=>value!==id):[...selected,id]) : (selected.includes(id)?'':id));
      const filtered=this.state.tracks.filter(track=>`${track.name} ${track.artist}`.toLocaleLowerCase().includes(this.state.query.toLocaleLowerCase()));
      return h('div',{className:this.props.classNameWrapper},
        h('p',{style:{fontSize:13,color:'#536879',margin:'0 0 10px'}},multiple?'按歌名选曲，可选多首。音乐文件、封面与歌词仍在“全部前台文案与歌单”统一管理。':'选择与这段手记对应的歌曲。'),
        h('div',{style:{display:'flex',gap:8,marginBottom:12}},
          h('input',{type:'search',value:this.state.query,placeholder:'查找歌名或歌手','aria-label':'查找歌曲',onChange:event=>this.setState({query:event.target.value}),style:{flex:1,minWidth:0,padding:10,border:'1px solid #b5c4cf',borderRadius:4}}),
          h('button',{type:'button',onClick:()=>this.refresh(),style:{padding:8,border:'1px solid #b5c4cf',borderRadius:4}},'刷新歌曲')),
        this.state.error?h('p',{role:'status',style:{color:'#aa442f'}},this.state.error):null,
        ...selected.filter(id=>!this.state.tracks.some(track=>track.id===id)).map(id=>h('div',{key:id,style:{padding:8}},'已选歌曲已隐藏或暂未找到：'+id+'（关联保留，恢复显示后自动生效）',h('button',{type:'button',onClick:()=>change(id)},' 移除'))),
        h('div',{style:{maxHeight:330,overflowY:'auto'}},...filtered.map(track=>h('label',{key:track.id,style:{display:'flex',alignItems:'center',gap:12,padding:8,borderBottom:'1px solid #e5ebef',cursor:'pointer'}},
          h('input',{type:multiple?'checkbox':'radio',name:this.props.forID,checked:selected.includes(track.id),onClick:()=>{if(!multiple&&selected.includes(track.id))change(track.id);},onChange:()=>change(track.id)}),
          track.cover?h('img',{src:track.cover,alt:'',style:{width:40,height:40,objectFit:'cover'}}):null,
          h('span',null,h('strong',{style:{display:'block',fontSize:14}},track.name),h('small',{style:{color:'#617789'}},track.artist))))));
    },
  });
  CMS.registerWidget('music-track-picker',Control);
}
